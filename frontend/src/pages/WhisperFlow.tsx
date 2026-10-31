import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useVoice } from '../hooks/useVoice';
import { useToast } from '../hooks/useToast';
import { billsApi, voiceApi } from '../services/api';
import AudioWaveform3D from '../three/AudioWaveform3D';
import {
  Mic,
  MicOff,
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  Globe,
  Radio,
  FileCheck,
  AlertTriangle,
  History,
  Check,
  X,
  FileText,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { LANGUAGE_LABELS, formatCurrency, formatDate } from '../utils/formatters';

export default function WhisperFlow() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const urlBillId = searchParams.get('billId') || '';
  const [selectedBillId, setSelectedBillId] = useState<string>(urlBillId);
  const [availableBills, setAvailableBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const [lang, setLang] = useState<string>('hi');

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error: voiceError,
    analyser,
    startListening,
    stopListening,
    clearTranscript,
  } = useVoice(lang);

  const [manualInput, setManualInput] = useState('');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [voiceHistory, setVoiceHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load available bills for selection
  useEffect(() => {
    let isMounted = true;
    billsApi
      .list({ limit: 15 })
      .then((res) => {
        if (!isMounted) return;
        const list = res.bills || [];
        setAvailableBills(list);
        if (!selectedBillId && list.length > 0) {
          setSelectedBillId(list[0].id);
          setSelectedBill(list[0]);
        } else if (selectedBillId) {
          const found = list.find((b: any) => b.id === selectedBillId);
          if (found) setSelectedBill(found);
        }
      })
      .catch(() => {
        // Fallback demo bills if offline
        const mockBills = [
          {
            id: 'demo-bill-1',
            billNumber: 'BILL-2026-001',
            vendorName: 'Kirana Store',
            totalAmount: 1450,
            status: 'pending',
          },
          {
            id: 'demo-bill-2',
            billNumber: 'BILL-2026-002',
            vendorName: 'Punjab Traders',
            totalAmount: 3200,
            status: 'reviewed',
          },
        ];
        if (isMounted) {
          setAvailableBills(mockBills);
          if (!selectedBillId) {
            setSelectedBillId(mockBills[0].id);
            setSelectedBill(mockBills[0]);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update selectedBill when selectedBillId changes
  useEffect(() => {
    if (!selectedBillId) return;
    const found = availableBills.find((b) => b.id === selectedBillId);
    if (found) {
      setSelectedBill(found);
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('billId', selectedBillId);
      return next;
    });
  }, [selectedBillId, availableBills, setSearchParams]);

  // Keep editable transcript in sync with voice input
  useEffect(() => {
    if (transcript) {
      setEditableTranscript(transcript);
    }
  }, [transcript]);

  // Load Voice History
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await voiceApi.history();
      setVoiceHistory(res.data || []);
    } catch (err: any) {
      // In offline mode, use fallback sample history
      setVoiceHistory([
        {
          id: 'vc-sample-1',
          fieldName: 'quantity',
          originalValue: 'Qty: 2',
          correctedValue: 'Correct quantity of milk to 5',
          createdAt: new Date().toISOString(),
          bill: { billNumber: 'BILL-2026-001', vendorName: 'Kirana Store' },
        },
      ]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle parsing of voice command
  const handleParse = async (textToParse: string) => {
    const query = textToParse.trim();
    if (!query) {
      addToast({ type: 'warning', message: 'Please speak or enter a voice command first.' });
      return;
    }

    setIsParsing(true);
    try {
      const res = await voiceApi.parse({
        transcript: query,
        language: lang,
        billId: selectedBillId,
      });

      setParsedResult(res.data);
      if (res.data?.isAmbiguous) {
        addToast({
          type: 'warning',
          message: res.data.clarificationPrompt || 'Ambiguous command. Please clarify.',
        });
      } else {
        addToast({
          type: 'success',
          message: `Voice command parsed: ${res.data.action.replace('_', ' ')} (${Math.round((res.data.confidence || 0.8) * 100)}% confidence)`,
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Voice parsing failed' });
    } finally {
      setIsParsing(false);
    }
  };

  // Handle applying the voice command to the ledger
  const handleApplyCommand = async () => {
    if (!parsedResult || !selectedBillId) return;

    if (parsedResult.isAmbiguous) {
      addToast({
        type: 'error',
        message: 'Cannot apply ambiguous command. Please provide specific details.',
      });
      return;
    }

    setIsApplying(true);
    try {
      const res = await voiceApi.apply({
        billId: selectedBillId,
        action: parsedResult,
      });

      addToast({
        type: 'success',
        message: res.data?.message || 'Voice correction applied to ledger successfully!',
      });

      // Clear state and refresh history
      setParsedResult(null);
      clearTranscript();
      setEditableTranscript('');
      setManualInput('');
      await loadHistory();
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to apply voice command' });
    } finally {
      setIsApplying(false);
    }
  };

  // Quick 1-click test templates
  const voiceShortcuts = [
    { label: 'Correct milk qty to 5', text: 'Correct the quantity of milk to 5', lang: 'en' },
    { label: 'Change rice price to 60', text: 'Change the price of rice to 60', lang: 'en' },
    { label: 'Add 2 notebooks', text: 'Add 2 notebooks', lang: 'en' },
    { label: 'Change customer to Ramesh', text: 'Change customer name to Ramesh Kumar', lang: 'en' },
    { label: 'Correct bill date to today', text: 'Correct the bill date to 2026-10-31', lang: 'en' },
    { label: 'चावल का भाव 60 करो (Hindi)', text: 'चावल का भाव 60 रुपये करो', lang: 'hi' },
    { label: 'ਦੁੱਧ ਦੀ ਮਾਤਰਾ 5 ਕਰੋ (Punjabi)', text: 'ਦੁੱਧ ਦੀ ਮਾਤਰਾ 5 ਕਰੋ', lang: 'pa' },
  ];

  const handleShortcutClick = (shortcut: { text: string; lang: string }) => {
    setLang(shortcut.lang);
    setManualInput(shortcut.text);
    setEditableTranscript(shortcut.text);
    handleParse(shortcut.text);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium mb-2">
            <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Module 05 — WhisperFlow Audio AI
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            WhisperFlow Voice Correction
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Hands-free digital accounting: correct quantities, prices, customers, and line items in English, Hindi, and Punjabi.
          </p>
        </div>

        {/* Target Bill Selector */}
        <div className="flex items-center gap-2 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2">
          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="text-xs">
            <div className="text-slate-400 text-[10px] font-mono uppercase">Target Bill</div>
            <select
              value={selectedBillId}
              onChange={(e) => setSelectedBillId(e.target.value)}
              className="bg-transparent text-slate-100 font-bold focus:outline-none cursor-pointer text-xs"
            >
              {availableBills.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                  {b.billNumber || b.id.slice(0, 8)} — {b.vendorName || 'General Bill'} (₹{b.totalAmount || 0})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main 3D Waveform Environment Card */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Status indicator top right */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Radio className={`w-3.5 h-3.5 ${isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-[11px] font-mono text-slate-400">
            {isListening ? 'Streaming Real Audio Spectrum' : 'Microphone Idle'}
          </span>
        </div>

        {/* Language Pill Selector */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-900/60 border border-white/10 rounded-lg p-1">
          <Globe className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
          {(['hi', 'pa', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                lang === l
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {LANGUAGE_LABELS[l]}
            </button>
          ))}
        </div>

        {/* 3D Waveform Canvas with Real Audio Reactivity */}
        <div className="w-full h-72 sm:h-80">
          <AudioWaveform3D isListening={isListening} analyser={analyser} />
        </div>

        {/* Record Control & Status */}
        <div className="mt-2 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-glow-emerald animate-pulse scale-105'
                : 'bg-gradient-to-tr from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 shadow-glow-cyan'
            }`}
            title={isListening ? 'Click to stop listening' : 'Click to start voice recording'}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <div>
            <div className="text-sm font-bold text-slate-100">
              {isListening ? 'Listening... Speak your command' : 'Tap microphone to speak command'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {!isSupported
                ? 'Browser speech recognition unavailable. Real-time microphone audio visualizer active with text fallback.'
                : 'Speak naturally in Hindi, English, or Punjabi'}
            </p>
            {voiceError && (
              <p className="text-xs text-amber-400 mt-1 font-mono">{voiceError}</p>
            )}
          </div>
        </div>

        {/* Live / Editable Speech Transcript */}
        {(editableTranscript || interimTranscript) && (
          <div className="w-full mt-6 p-4 rounded-xl bg-slate-900/80 border border-white/10 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                Recognized Speech (Editable)
              </span>
              <button
                type="button"
                onClick={() => {
                  clearTranscript();
                  setEditableTranscript('');
                }}
                className="text-[11px] text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 font-mono"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>

            <textarea
              value={editableTranscript}
              onChange={(e) => setEditableTranscript(e.target.value)}
              rows={2}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
              placeholder="Spoken words appear here..."
            />
            {interimTranscript && (
              <p className="text-xs text-slate-500 italic mt-1 font-mono">
                ... {interimTranscript}
              </p>
            )}

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                disabled={isParsing || !editableTranscript.trim()}
                onClick={() => handleParse(editableTranscript)}
                className="btn-primary py-1.5 px-4 text-xs inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>{isParsing ? 'Parsing NLP...' : 'Parse Voice Command'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Grid: Parsed Action & Confirmation + Quick Test Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Parsed Action Breakdown & Safety Confirmation */}
        <div className="glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Parsed Voice Action Breakdown</h3>
              </div>
              {parsedResult && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    parsedResult.confidence >= 0.85
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : parsedResult.confidence >= 0.65
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}
                >
                  {Math.round((parsedResult.confidence || 0.8) * 100)}% Confidence
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic NLP parsing mapping natural multi-lingual spoken intents into structured ledger schema modifications.
            </p>
          </div>

          {parsedResult ? (
            <div className="space-y-4">
              {/* Ambiguity Alert */}
              {parsedResult.isAmbiguous ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Ambiguous Command Detected</span>
                  </div>
                  <p>{parsedResult.clarificationPrompt}</p>
                </div>
              ) : (
                /* Proposed Change Preview Card */
                <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/30 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Target Action:</span>
                    <span className="text-emerald-400 font-bold uppercase">
                      {parsedResult.action.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Target Field:</span>
                    <span className="text-cyan-300">{parsedResult.targetField || 'line item'}</span>
                  </div>

                  {parsedResult.productName && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-400">Product / Item:</span>
                      <span className="text-slate-100 font-bold">{parsedResult.productName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">Requested Modification:</span>
                    <span className="text-emerald-300 font-semibold">{parsedResult.requestedChange}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Target Bill:</span>
                    <span className="text-slate-300">
                      {selectedBill?.billNumber || selectedBillId.slice(0, 8)}
                    </span>
                  </div>

                  {parsedResult.requiresConfirmation && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 pt-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Financial / identity modification requires explicit confirmation</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons: Confirm or Reject */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={isApplying || parsedResult.isAmbiguous}
                  onClick={handleApplyCommand}
                  className="flex-1 btn-primary py-2 px-3 text-xs inline-flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isApplying ? 'Applying to Ledger...' : 'Confirm & Apply Change'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setParsedResult(null)}
                  className="btn-ghost py-2 px-3 text-xs text-slate-400 hover:text-red-400 inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-500 font-mono space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-slate-600" />
              <p>Speak via microphone or pick an example command to preview structured intent before applying to ledger.</p>
            </div>
          )}

          {/* Manual Text Command Fallback */}
          <div className="pt-3 border-t border-white/5 space-y-1.5">
            <label className="text-[10px] font-mono text-slate-400 uppercase">
              Manual Command Entry Fallback
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleParse(manualInput)}
                placeholder="e.g. Correct the quantity of milk to 5"
                className="input-field text-xs py-2"
              />
              <button
                type="button"
                disabled={isParsing || !manualInput.trim()}
                onClick={() => handleParse(manualInput)}
                className="btn-secondary py-2 px-3 text-xs shrink-0"
              >
                Parse
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Example Voice Commands & History Audit Trail */}
        <div className="glass-panel p-6 space-y-6">
          {/* Quick 1-Click Example Voice Commands */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">Standard Voice Commands</h3>
            </div>
            <p className="text-xs text-slate-400">
              Click any verified voice pattern to test multi-lingual voice corrections:
            </p>

            <div className="flex flex-col gap-2">
              {voiceShortcuts.map((sc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleShortcutClick(sc)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/40 text-left transition-all group flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                      {sc.label}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      "{sc.text}"
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 py-0.5 rounded bg-black/40">
                    {sc.lang}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Corrections Audit Trail */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Voice Edit Audit Trail</h3>
              </div>
              <button
                type="button"
                onClick={loadHistory}
                disabled={isLoadingHistory}
                className="text-[10px] font-mono text-cyan-400 hover:underline"
              >
                {isLoadingHistory ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {voiceHistory.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono italic">
                  No voice corrections recorded yet.
                </p>
              ) : (
                voiceHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-[11px] font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-bold text-cyan-400 uppercase">{item.fieldName}</span>
                      <span className="text-slate-500 text-[10px]">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500">{item.originalValue}</span>
                      <span className="mx-1.5 text-emerald-400">→</span>
                      <span className="text-emerald-300">{item.correctedValue}</span>
                    </div>
                    {item.bill && (
                      <div className="text-[10px] text-slate-500">
                        Bill: {item.bill.billNumber || 'Ledger Entry'} ({item.bill.vendorName || 'Shop'})
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
