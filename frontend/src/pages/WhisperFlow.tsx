import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useVoice } from '../hooks/useVoice';
import { useToast } from '../hooks/useToast';
import { billsApi, voiceApi, aiApi } from '../services/api';
import AudioWaveform3D from '../three/AudioWaveform3D';
import { speakText, stopSpeaking } from '../utils/speechSynthesis';
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
  Volume2,
  VolumeX,
  BarChart3,
  PieChart,
  LineChart,
  Table as TableIcon,
  TrendingUp,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { LANGUAGE_LABELS, formatCurrency, formatDate } from '../utils/formatters';

export default function WhisperFlow() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const urlBillId = searchParams.get('billId') || '';
  const [mode, setMode] = useState<'assistant' | 'bill_correction'>(urlBillId ? 'bill_correction' : 'assistant');
  const [selectedBillId, setSelectedBillId] = useState<string>(urlBillId);
  const [availableBills, setAvailableBills] = useState<any[]>([]);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const [lang, setLang] = useState<'en' | 'hi' | 'pa'>('en');
  const [speechOutputEnabled, setSpeechOutputEnabled] = useState<boolean>(true);

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
  const [isProcessing, setIsProcessing] = useState(false);

  // Results state
  const [assistantResponse, setAssistantResponse] = useState<any | null>(null);
  const [parsedBillAction, setParsedBillAction] = useState<any | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [voiceHistory, setVoiceHistory] = useState<any[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Load available bills for bill correction mode
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
      stopSpeaking();
    };
  }, []);

  // Update selectedBill when selectedBillId changes
  useEffect(() => {
    if (!selectedBillId) return;
    const found = availableBills.find((b) => b.id === selectedBillId);
    if (found) {
      setSelectedBill(found);
    }
  }, [selectedBillId, availableBills]);

  // Keep editable transcript in sync with incoming speech
  useEffect(() => {
    if (transcript) {
      setEditableTranscript(transcript);
    }
  }, [transcript]);

  // Load Voice History
  const loadHistory = useCallback(async () => {
    try {
      const res = await voiceApi.history();
      setVoiceHistory(res.data || []);
    } catch {
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
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Universal Voice Command Processor: Handles both BI accounting queries and bill corrections
  const handleExecuteVoiceCommand = async (textToProcess: string) => {
    const cleanText = textToProcess.trim();
    if (!cleanText) {
      addToast({ type: 'warning', message: 'Please speak or enter a voice command first.' });
      return;
    }

    setIsProcessing(true);
    setAssistantResponse(null);
    setParsedBillAction(null);

    try {
      // 1. If in bill_correction mode with a selected bill, test line-item parser first
      if (mode === 'bill_correction' && selectedBillId) {
        const billRes = await voiceApi.parse({
          transcript: cleanText,
          language: lang,
          billId: selectedBillId,
        });

        if (billRes.data && !billRes.data.isAmbiguous && billRes.data.action !== 'ambiguous') {
          setParsedBillAction(billRes.data);
          addToast({
            type: 'success',
            message: `Bill edit recognized: ${billRes.data.action.replace('_', ' ')}`,
          });
          if (speechOutputEnabled) {
            speakText(`Recognized ${billRes.data.action.replace('_', ' ')}: ${billRes.data.requestedChange}. Please confirm to apply.`, lang);
          }
          setIsProcessing(false);
          return;
        }
      }

      // 2. Query Natural Language Business Intelligence & Action Engine
      const aiRes = await aiApi.query({
        question: cleanText,
        language: lang,
      });

      setAssistantResponse(aiRes);

      let textToSpeak = aiRes.answer;
      if (lang === 'hi' && aiRes.answer_hi) textToSpeak = aiRes.answer_hi;
      if (lang === 'pa' && aiRes.answer_pa) textToSpeak = aiRes.answer_pa;

      if (speechOutputEnabled && textToSpeak) {
        speakText(textToSpeak, lang, { enabled: true });
      }

      addToast({
        type: 'success',
        message: 'Assistant response ready!',
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Voice command failed to process.' });
      if (speechOutputEnabled) {
        speakText('Sorry, I encountered an issue processing your request. Please try again.', lang);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm product catalog price update action
  const handleConfirmCatalogAction = async (actionProposal: any) => {
    setIsApplying(true);
    try {
      const res = await aiApi.confirmAction({
        action: actionProposal.action,
        productId: actionProposal.productId,
        newPrice: Number(actionProposal.proposedValue),
      });

      setAssistantResponse((prev: any) => ({
        ...prev,
        actionProposal: {
          ...prev.actionProposal,
          confirmed: true,
          confirmationMessage: res.message,
          auditNotice: res.historicalAuditNotice,
        },
      }));

      addToast({
        type: 'success',
        message: res.message,
      });

      if (speechOutputEnabled) {
        speakText(`Successfully updated selling price for ${actionProposal.productName} to ${actionProposal.proposedValue} rupees.`, lang);
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to update catalog.' });
    } finally {
      setIsApplying(false);
    }
  };

  // Apply bill item line correction
  const handleApplyBillCommand = async () => {
    if (!parsedBillAction || !selectedBillId) return;

    setIsApplying(true);
    try {
      const res = await voiceApi.apply({
        billId: selectedBillId,
        action: parsedBillAction,
      });

      addToast({
        type: 'success',
        message: res.data?.message || 'Voice correction applied to bill successfully!',
      });

      if (speechOutputEnabled) {
        speakText('Bill correction confirmed and applied to ledger.', lang);
      }

      setParsedBillAction(null);
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

  const handleShortcutClick = (text: string, shortcutLang: 'en' | 'hi' | 'pa') => {
    setLang(shortcutLang);
    setEditableTranscript(text);
    setManualInput(text);
    handleExecuteVoiceCommand(text);
  };

  const copyTableData = (tableData: any[], idx: number) => {
    if (!tableData || tableData.length === 0) return;
    const headers = Object.keys(tableData[0]).join(',');
    const rows = tableData.map((row) => Object.values(row).join(',')).join('\n');
    navigator.clipboard.writeText(`${headers}\n${rows}`);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium mb-2">
            <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Module 05 — WhisperFlow Audio AI & Assistant
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            WhisperFlow Voice Assistant
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Hands-free accounting: query sales metrics, check top products, update catalog prices, or correct bill items using real speech.
          </p>
        </div>

        {/* Mode Selector & TTS Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Mode Pill */}
          <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => {
                setMode('assistant');
                setParsedBillAction(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === 'assistant'
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Business Assistant
            </button>
            <button
              onClick={() => {
                setMode('bill_correction');
                setAssistantResponse(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === 'bill_correction'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-glow-emerald'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bill Line Editor
            </button>
          </div>

          {/* Speech Audio Output Toggle */}
          <button
            type="button"
            onClick={() => {
              if (speechOutputEnabled) stopSpeaking();
              setSpeechOutputEnabled(!speechOutputEnabled);
            }}
            title={speechOutputEnabled ? 'Mute Speech Readout' : 'Enable Speech Readout (TTS)'}
            className={`p-2.5 rounded-xl border transition-all ${
              speechOutputEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-glow-cyan'
                : 'bg-slate-900/80 text-slate-500 border-white/10 hover:text-slate-300'
            }`}
          >
            {speechOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Target Bill Selector (when in bill_correction mode) */}
      {mode === 'bill_correction' && (
        <div className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-200">Active Bill Context</div>
              <div className="text-[10px] text-slate-400">
                Voice edits like "quantity of milk to 5" will apply to this bill
              </div>
            </div>
          </div>

          <select
            value={selectedBillId}
            onChange={(e) => setSelectedBillId(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {availableBills.map((b) => (
              <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                {b.billNumber || b.id.slice(0, 8)} — {b.customer?.name || b.vendorName || 'Counter Sale'} (₹{b.totalAmount || 0})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── 3D Audio Waveform Environment Card ───────────────────────────────── */}
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
          {(['en', 'hi', 'pa'] as const).map((l) => (
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

        {/* Record Control Button & Status */}
        <div className="mt-2 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-glow-rose animate-pulse scale-105'
                : 'bg-gradient-to-tr from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 shadow-glow-cyan'
            }`}
            title={isListening ? 'Click to stop listening' : 'Click to start voice recording'}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <div>
            <div className="text-sm font-bold text-slate-100">
              {isListening ? 'Listening... Speak your command' : 'Tap microphone to speak'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {!isSupported
                ? 'Browser SpeechRecognition unavailable. Please use the text input fallback below.'
                : 'Speak naturally in English, Hindi, or Punjabi'}
            </p>
            {voiceError && (
              <div className="mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 max-w-md mx-auto flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{voiceError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live / Editable Speech Transcript Box */}
        {(editableTranscript || interimTranscript) && (
          <div className="w-full max-w-2xl mt-6 p-4 rounded-xl bg-slate-900/80 border border-white/10 text-left space-y-2">
            <div className="flex items-center justify-between">
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
              <p className="text-xs text-slate-500 italic font-mono">
                ... {interimTranscript}
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={isProcessing || !editableTranscript.trim()}
                onClick={() => handleExecuteVoiceCommand(editableTranscript)}
                className="btn-primary py-2 px-4 text-xs inline-flex items-center gap-1.5 shadow-glow-cyan"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>{isProcessing ? 'Processing Voice Command...' : 'Execute Command'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Text Input Fallback Bar */}
        <div className="w-full max-w-2xl mt-4 flex items-center gap-2 pt-2 border-t border-white/5">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecuteVoiceCommand(manualInput)}
            placeholder={
              mode === 'assistant'
                ? 'Type command fallback (e.g. How much did I sell today?)'
                : 'Type bill edit (e.g. Correct quantity of milk to 5)'
            }
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={() => handleExecuteVoiceCommand(manualInput)}
            disabled={isProcessing || !manualInput.trim()}
            className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Results Display Area ─────────────────────────────────────────────── */}
      {assistantResponse && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in border-cyan-500/30">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">Assistant Response</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Verified Accounting Intelligence
            </span>
          </div>

          {/* Formatted Natural Language Answer */}
          <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap bg-slate-900/80 p-4 rounded-xl border border-white/5">
            {lang === 'hi' && assistantResponse.answer_hi
              ? assistantResponse.answer_hi
              : lang === 'pa' && assistantResponse.answer_pa
              ? assistantResponse.answer_pa
              : assistantResponse.answer}
          </div>

          {/* Controlled Write Action Proposal Card */}
          {assistantResponse.actionProposal && (
            <div className="p-4 rounded-xl bg-black/40 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" /> Action Proposal: Catalog Price Update
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Confirmation Required
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-slate-400 text-[11px]">Product</div>
                  <div className="font-semibold text-slate-100">
                    {assistantResponse.actionProposal.productName}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-slate-400 text-[11px]">Category & Unit</div>
                  <div className="font-semibold text-slate-100">
                    {assistantResponse.actionProposal.category} • per {assistantResponse.actionProposal.unit}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-slate-400 text-[11px]">Current Price</div>
                  <div className="font-mono font-bold text-slate-300">
                    ₹{assistantResponse.actionProposal.currentValue}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-emerald-400 text-[11px]">Proposed Price</div>
                  <div className="font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                    ₹{assistantResponse.actionProposal.proposedValue}
                    <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-400">
                      {assistantResponse.actionProposal.percentChange}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                {assistantResponse.actionProposal.impactSummary}
              </p>

              {assistantResponse.actionProposal.confirmed ? (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold">
                      {assistantResponse.actionProposal.confirmationMessage}
                    </div>
                    <div className="text-[10px] text-emerald-400/80">
                      {assistantResponse.actionProposal.auditNotice}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isApplying}
                    onClick={() => handleConfirmCatalogAction(assistantResponse.actionProposal)}
                    className="flex-1 btn-primary py-2 px-3 text-xs flex items-center justify-center gap-1.5 shadow-glow-emerald"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm & Update Catalog</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssistantResponse(null)}
                    className="btn-ghost py-2 px-3 text-xs text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Visualizations: Bar / Line / Donut / Comparison / Table */}
          {assistantResponse.visualization && (
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                  {assistantResponse.visualization.type === 'bar' && <BarChart3 className="w-4 h-4" />}
                  {assistantResponse.visualization.type === 'line' && <LineChart className="w-4 h-4" />}
                  {assistantResponse.visualization.type === 'donut' && <PieChart className="w-4 h-4" />}
                  {assistantResponse.visualization.type === 'comparison' && <TrendingUp className="w-4 h-4" />}
                  {assistantResponse.visualization.type === 'table' && <TableIcon className="w-4 h-4" />}
                  <span>{assistantResponse.visualization.title}</span>
                </div>

                {assistantResponse.visualization.tableData && (
                  <button
                    onClick={() => copyTableData(assistantResponse.visualization.tableData, 0)}
                    title="Copy table data as CSV"
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedIndex === 0 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 0 ? 'Copied' : 'Export CSV'}</span>
                  </button>
                )}
              </div>

              {/* Bar Chart */}
              {assistantResponse.visualization.type === 'bar' && (
                <div className="space-y-2 pt-1">
                  {assistantResponse.visualization.labels.map((label: string, i: number) => {
                    const val = assistantResponse.visualization.datasets[0]?.data[i] || 0;
                    const maxVal = Math.max(...(assistantResponse.visualization.datasets[0]?.data || [1]));
                    const percent = Math.min(100, Math.round((val / (maxVal || 1)) * 100));
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300 font-medium truncate max-w-[200px]">{label}</span>
                          <span className="font-mono font-bold text-cyan-400">
                            ₹{val.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Line Trend Chart */}
              {assistantResponse.visualization.type === 'line' && (
                <div className="pt-2">
                  <div className="h-28 flex items-end gap-2 border-b border-white/10 pb-2">
                    {assistantResponse.visualization.datasets[0]?.data.map((val: number, i: number) => {
                      const maxVal = Math.max(...assistantResponse.visualization.datasets[0].data);
                      const heightPercent = Math.max(15, Math.round((val / (maxVal || 1)) * 100));
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                          <div className="text-[10px] font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            ₹{val}
                          </div>
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-cyan-600/30 to-cyan-400 group-hover:to-emerald-400 transition-all"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <div className="text-[10px] text-slate-400 truncate w-full text-center">
                            {assistantResponse.visualization.labels[i]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comparison Card */}
              {assistantResponse.visualization.type === 'comparison' && (
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  {assistantResponse.visualization.labels.map((lbl: string, i: number) => {
                    const val = assistantResponse.visualization.datasets[0]?.data[i] || 0;
                    return (
                      <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                        <div className="text-[11px] text-slate-400 truncate">{lbl}</div>
                        <div className="text-sm font-mono font-bold text-slate-100 mt-1">
                          ₹{val.toLocaleString('en-IN')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                {assistantResponse.visualization.summary}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bill Correction Confirmation Card */}
      {parsedBillAction && (
        <div className="glass-panel p-6 space-y-4 animate-fade-in border-emerald-500/30">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Bill Correction Confirmation</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {Math.round((parsedBillAction.confidence || 0.9) * 100)}% Confidence
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Target Action:</span>
              <span className="text-emerald-400 font-bold uppercase">
                {parsedBillAction.action.replace('_', ' ')}
              </span>
            </div>
            {parsedBillAction.productName && (
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Product / Item:</span>
                <span className="text-slate-100 font-bold">{parsedBillAction.productName}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Requested Change:</span>
              <span className="text-emerald-300 font-semibold">{parsedBillAction.requestedChange}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Target Bill:</span>
              <span className="text-slate-300">
                {selectedBill?.billNumber || selectedBillId?.slice(0, 8)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isApplying}
              onClick={handleApplyBillCommand}
              className="flex-1 btn-primary py-2 px-3 text-xs flex items-center justify-center gap-1.5 shadow-glow-emerald"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isApplying ? 'Applying to Bill...' : 'Confirm & Apply Change'}</span>
            </button>
            <button
              type="button"
              onClick={() => setParsedBillAction(null)}
              className="btn-ghost py-2 px-3 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Quick Test Voice Commands ────────────────────────────────────────── */}
      <div className="glass-panel p-6 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">Sample Voice Commands (1-Click Test)</h3>
        </div>
        <p className="text-xs text-slate-400">
          Click any example below to test speech execution in English, Hindi, or Punjabi
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
          {[
            { label: 'How much did I sell today?', lang: 'en' },
            { label: 'Show my top-selling products', lang: 'en' },
            { label: 'How much payment is pending?', lang: 'en' },
            { label: 'Change the price of Maggi to 15 rupees', lang: 'en' },
            { label: 'मेरी कुल कमाई कितनी है? (Hindi)', text: 'मेरी कुल कमाई कितनी है', lang: 'hi' },
            { label: 'ਸਭ ਤੋਂ ਵੱਧ ਵਿਕਣ ਵਾਲਾ ਉਤਪਾਦ ਕਿਹੜਾ ਹੈ? (Punjabi)', text: 'ਸਭ ਤੋਂ ਵੱਧ ਵਿਕਣ ਵਾਲਾ ਉਤਪਾਦ ਕਿਹੜਾ ਹੈ', lang: 'pa' },
            { label: 'Correct milk qty to 5 (Bill)', text: 'Correct the quantity of milk to 5', lang: 'en' },
            { label: 'Change rice price to 60 (Bill)', text: 'Change the price of rice to 60', lang: 'en' },
          ].map((item: any, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleShortcutClick(item.text || item.label, item.lang)}
              className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-400/30 text-left text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
            >
              <span className="truncate">{item.label}</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Voice Correction Audit History ───────────────────────────────────── */}
      <div className="glass-panel p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-100">Voice Correction Audit Trail</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Immutable Ledger</span>
        </div>

        {voiceHistory.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-slate-500">
            No voice corrections logged yet.
          </div>
        ) : (
          <div className="divide-y divide-white/5 space-y-1">
            {voiceHistory.slice(0, 5).map((vh) => (
              <div key={vh.id} className="py-2.5 flex items-start justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{vh.correctedValue}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Target: {vh.fieldName} • {vh.originalValue ? `from "${vh.originalValue}"` : ''}
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-500">
                  {formatDate(vh.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
