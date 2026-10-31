import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVoice } from '../hooks/useVoice';
import { useToast } from '../hooks/useToast';
import { billsApi } from '../services/api';
import AudioWaveform3D from '../components/3d/AudioWaveform3D';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  Send,
  RotateCcw,
  CheckCircle2,
  Globe,
  Radio,
  FileCheck,
} from 'lucide-react';
import { LANGUAGE_LABELS } from '../utils/formatters';

export default function WhisperFlow() {
  const [searchParams] = useSearchParams();
  const billId = searchParams.get('billId') || undefined;

  const { addToast } = useToast();
  const [lang, setLang] = useState<string>('hi');

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error: voiceError,
    startListening,
    stopListening,
    clearTranscript,
  } = useVoice(lang);

  const [manualInput, setManualInput] = useState('');
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Quick shop voice command templates
  const voiceShortcuts = [
    { label: 'Add 5 kg Rice', text: 'add Basmati Rice 5 kg' },
    { label: 'Add 2 Ltr Milk', text: 'add Amul Milk 2 ltr' },
    { label: 'Change Total to ₹850', text: 'set total amount to 850' },
    { label: 'Set Customer Ramesh', text: 'customer name is Ramesh Kumar' },
  ];

  const handleParseText = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setIsParsing(true);
    try {
      const res = await billsApi.voice({
        transcript: textToParse,
        language: lang,
        billId,
      });

      setParsedResult(res.parsed);
      addToast({
        type: 'success',
        message: 'Voice intent extracted and parsed by NLP model!',
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Voice parsing failed' });
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyShortcut = (text: string) => {
    setManualInput(text);
    handleParseText(text);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium mb-2">
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
          Module 04 — WhisperFlow Voice AI
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Acoustic Dialect & Voice Assistant
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform hands-free bill corrections, add line items, and adjust numbers using Hindi,
          English, and Punjabi speech commands.
        </p>
      </div>

      {/* Main 3D Waveform & Mic Section */}
      <div className="glass-panel p-8 relative overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Status indicator top right */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <Radio className={`w-3.5 h-3.5 ${isListening ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-[11px] font-mono text-slate-400">
            {isListening ? 'Streaming Audio Spectrum' : 'Microphone Idle'}
          </span>
        </div>

        {/* 3D Waveform Canvas */}
        <div className="w-full h-72">
          <AudioWaveform3D isListening={isListening} />
        </div>

        {/* Central Record Trigger */}
        <div className="mt-4 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-glow-emerald animate-pulse'
                : 'bg-gradient-to-tr from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 shadow-glow-cyan'
            }`}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <div>
            <div className="text-sm font-bold text-slate-100">
              {isListening ? 'Listening to speech...' : 'Click microphone to speak'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {!isSupported
                ? 'Web Speech API unavailable in this browser. Use simulated input below.'
                : 'Speak naturally in Hindi, Hinglish, or Punjabi'}
            </p>
          </div>
        </div>

        {/* Real-time Transcription Stream */}
        {(transcript || interimTranscript) && (
          <div className="w-full mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-left">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
              Live Speech Transcript
            </span>
            <p className="text-sm text-slate-100 font-mono">
              {transcript}
              <span className="text-slate-500 italic">{interimTranscript}</span>
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={clearTranscript}
                className="btn-ghost py-1 px-2.5 text-xs font-mono"
              >
                Clear
              </button>
              <button
                onClick={() => handleParseText(transcript)}
                className="btn-primary py-1 px-3 text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Parse Speech Intent</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Language Dialect Selection & Simulated Testing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dialect Selector */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Language & Acoustic Dialect</h3>
          </div>
          <p className="text-xs text-slate-400">
            Switch speech recognition acoustic model to optimize phoneme matching for your native shop dialect.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {(['hi', 'pa', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  lang === l
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <div className="text-xs font-bold">{LANGUAGE_LABELS[l]}</div>
              </button>
            ))}
          </div>

          {/* Quick Voice Shortcuts */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-500">
              Simulated Speech Commands (1-Click Test)
            </span>
            <div className="flex flex-wrap gap-2">
              {voiceShortcuts.map((sc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyShortcut(sc.text)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400 text-[11px] text-slate-300 transition-colors"
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NLP Parsed Output Card */}
        <div className="glass-panel p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Structured NLP Parsing Output</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Natural Language entity extraction mapping spoken phrases to database ledger schemas.
            </p>
          </div>

          {parsedResult ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="text-emerald-400 font-bold uppercase">{parsedResult.action}</span>
              </div>
              {parsedResult.itemDescription && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Product:</span>
                  <span className="text-slate-200">{parsedResult.itemDescription}</span>
                </div>
              )}
              {parsedResult.quantity && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="text-slate-200">{parsedResult.quantity} {parsedResult.unit}</span>
                </div>
              )}
              {parsedResult.fieldName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Field Adjusted:</span>
                  <span className="text-cyan-400">{parsedResult.fieldName} = {parsedResult.value}</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/10 text-[10px] text-slate-500">
                ✅ Correction recorded into schema
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-500 font-mono">
              Speak or click a simulated command to observe structured NLP parsing.
            </div>
          )}

          {/* Manual Input Fallback */}
          <div className="pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Or type voice command manually..."
                className="input-field text-xs py-2"
                onKeyDown={(e) => e.key === 'Enter' && handleParseText(manualInput)}
              />
              <button
                onClick={() => handleParseText(manualInput)}
                className="btn-primary py-2 px-3 text-xs"
              >
                Parse
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
