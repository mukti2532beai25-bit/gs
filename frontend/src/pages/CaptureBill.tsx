import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { billsApi } from '../services/api';
import ScanningPortal3D, { ScanState } from '../three/ScanningPortal3D';
import CameraScannerModal from '../components/common/CameraScannerModal';

import {
  Upload,
  Camera,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  ArrowRight,
  RotateCcw,
  X,
  ShieldCheck,
  FileType,
} from 'lucide-react';
import { LANGUAGE_LABELS } from '../utils/formatters';

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf'];

export default function CaptureBill() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'pa'>('hi');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Validation function
  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);

    // Empty file check
    if (!file || file.size === 0) {
      setErrorMessage('The selected file is empty.');
      addToast({ type: 'error', message: 'The selected file is empty.' });
      return false;
    }

    // Extension or mimetype check
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImageMime = file.type.startsWith('image/');
    const isPdfMime = file.type === 'application/pdf';

    if (!isImageMime && !isPdfMime && (!ext || !ALLOWED_EXTENSIONS.includes(ext))) {
      const err = `Unsupported format (.${ext || 'unknown'}). Supported: ${ALLOWED_EXTENSIONS.join(', ')}`;
      setErrorMessage(err);
      addToast({ type: 'error', message: err });
      return false;
    }


    // Size check
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      const err = `File size (${sizeMb.toFixed(1)}MB) exceeds limit of ${MAX_FILE_SIZE_MB}MB.`;
      setErrorMessage(err);
      addToast({ type: 'error', message: err });
      return false;
    }

    setSelectedFile(file);
    setIsPdf(ext === 'pdf');

    if (ext === 'pdf') {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(URL.createObjectURL(file));
    }

    setScanState('idle');
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPdf(false);
    setErrorMessage(null);
    setScanState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Run the full sequential processing workflow
  const handleProcessScan = async () => {
    if (!selectedFile) {
      addToast({ type: 'warning', message: 'Please select or capture a bill first.' });
      return;
    }

    setErrorMessage(null);
    setScanState('uploading');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('language', language);

      // Visual stage 1: Scanning
      await new Promise((r) => setTimeout(r, 600));
      setScanState('scanning');

      // Visual stage 2: Extracting & Vocab matching
      await new Promise((r) => setTimeout(r, 800));
      setScanState('extracting');

      const res = await billsApi.capture(formData);

      setScanState('complete');
      addToast({
        type: 'success',
        message: 'Bill parsed! Redirecting to human review...',
      });

      // Brief delay so user sees complete 3D emerald flash
      setTimeout(() => {
        navigate(`/review/${res.data?.id || res.bill?.id}`);
      }, 700);
    } catch (err: any) {
      setScanState('failed');
      const msg = err.message || 'Processing failed. Please retry.';
      setErrorMessage(msg);
      addToast({ type: 'error', message: msg });
    }
  };

  // Instant demo generator for fast review testing
  const handleLoadSampleBill = async () => {
    setErrorMessage(null);
    setScanState('uploading');

    try {
      const formData = new FormData();
      formData.append('language', language);

      setScanState('scanning');
      await new Promise((r) => setTimeout(r, 500));
      setScanState('extracting');

      const res = await billsApi.capture(formData);

      setScanState('complete');
      addToast({ type: 'success', message: 'Sample bill structured successfully!' });

      setTimeout(() => {
        navigate(`/review/${res.data?.id || res.bill?.id}`);
      }, 600);
    } catch (err: any) {
      setScanState('failed');
      setErrorMessage(err.message || 'Sample generation failed');
      addToast({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-medium mb-2">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Module 02 — Multi-Modal Bill Capture</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Capture & Scan Handwritten Bill
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload phone photos, scan documents, or capture receipts with real-time 3D OCR laser sweeps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Column (5 cols): 3D Scanning Portal Viewport ───────────────── */}
        <div className="lg:col-span-5 glass-panel p-6 relative overflow-hidden flex flex-col items-center justify-center">
          {/* Status badge on top left */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                scanState === 'scanning' || scanState === 'extracting'
                  ? 'bg-emerald-400 animate-pulse'
                  : scanState === 'failed'
                  ? 'bg-red-400'
                  : 'bg-cyan-400'
              }`}
            />
            <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider">
              {scanState === 'idle'
                ? 'Portal Ready'
                : scanState === 'uploading'
                ? 'Uploading File'
                : scanState === 'scanning'
                ? '3D Laser Sweep'
                : scanState === 'extracting'
                ? 'Matching Vocab'
                : scanState === 'complete'
                ? 'Verified'
                : 'Failed'}
            </span>
          </div>

          {/* 3D WebGL Canvas */}
          <div className="w-full h-80">
            <ScanningPortal3D scanState={scanState} />
          </div>

          {/* Progress message footer */}
          <div className="w-full text-center mt-2 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-400 font-mono">
              {scanState === 'uploading' && (
                <span className="text-cyan-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading document to server...
                </span>
              )}
              {scanState === 'scanning' && (
                <span className="text-emerald-400 flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin-slow" /> Running neural OCR in {LANGUAGE_LABELS[language]}...
                </span>
              )}
              {scanState === 'extracting' && (
                <span className="text-cyan-300 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Normalizing line-items & shop vocabulary...
                </span>
              )}
              {scanState === 'complete' && (
                <span className="text-emerald-400 flex items-center justify-center gap-2 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Extraction complete! Loading review screen...
                </span>
              )}
              {scanState === 'failed' && (
                <span className="text-red-400 flex items-center justify-center gap-2 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" /> Processing error. Click retry below.
                </span>
              )}
              {scanState === 'idle' && 'Position document within reticle bounds'}
            </p>
          </div>
        </div>

        {/* ── Right Column (7 cols): Upload Controls & Configuration ──────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Language Selection */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                OCR Phonetic & Script Hint
              </label>
              <span className="text-[10px] font-mono text-cyan-400">Multi-Lingual Engine</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['en', 'hi', 'pa'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    language === l
                      ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-glow-cyan'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-sm font-bold">{LANGUAGE_LABELS[l]}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {l === 'hi' ? 'Devanagari' : l === 'pa' ? 'Gurmukhi' : 'Latin Script'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic,.pdf,image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 relative overflow-hidden ${
              isDragOver
                ? 'border-emerald-400 bg-emerald-950/20'
                : previewUrl || isPdf
                ? 'border-cyan-500/40 bg-cyan-950/10'
                : 'border-white/10 hover:border-cyan-500/30 bg-white/[0.02]'
            }`}
          >
            {/* If a file is selected: Display preview with metadata */}
            {selectedFile ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {isPdf ? (
                    <div className="w-24 h-28 rounded-xl bg-slate-900 border border-white/10 flex flex-col items-center justify-center text-cyan-400 shadow-xl">
                      <FileType className="w-10 h-10 mb-1" />
                      <span className="text-[10px] font-mono uppercase font-bold">PDF Bill</span>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-xl overflow-hidden border border-cyan-400/40 shadow-2xl relative">
                      <img src={previewUrl!} alt="Selected Bill" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <button
                    onClick={handleClearSelection}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-slate-900 text-slate-300 hover:text-white border border-white/20 shadow-lg"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-center">
                  <div className="text-sm font-semibold text-slate-100 max-w-sm truncate">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for neural extraction
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Retake with Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-ghost py-1.5 px-3 text-xs text-slate-400 hover:text-white"
                    >
                      <span>Choose Different File</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty Dropzone State */
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Capture with live camera or drag and drop bill receipt
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports JPG, PNG, WEBP, HEIC, or PDF up to 10MB
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="btn-primary py-2.5 px-5 text-xs font-bold shadow-glow-emerald"
                  >
                    <Camera className="w-4 h-4 text-slate-950" />
                    <span className="text-slate-950">Open Camera Scanner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary py-2.5 px-4 text-xs font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Browse Files</span>
                  </button>
                </div>
              </div>
            )}
          </div>


          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-red-200">Validation Error:</span> {errorMessage}
              </div>
              <button
                onClick={handleProcessScan}
                className="text-xs font-mono font-bold text-red-400 hover:text-red-300 underline underline-offset-2 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleProcessScan}
              disabled={!selectedFile || scanState === 'uploading' || scanState === 'scanning' || scanState === 'extracting'}
              className="btn-primary flex-1 justify-center py-3.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanState === 'uploading' || scanState === 'scanning' || scanState === 'extracting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Processing Extraction...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Run 3D Neural Scan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLoadSampleBill}
              disabled={scanState === 'uploading' || scanState === 'scanning' || scanState === 'extracting'}
              className="btn-secondary py-3.5 px-5 text-sm justify-center"
            >
              <span>Instant Sample Bill</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Informational Verification Box */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Authentic Accounting Rule:</span>{' '}
              BahiVerse AI extracts verified values from your paper bill and matches them with your
              store's slang vocabulary. Uncertain quantities or prices are flagged with amber tags
              in the review phase.
            </div>
          </div>
        </div>
      </div>

      {/* 3D WebRTC Live Camera Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(file) => {
          validateAndSetFile(file);
          addToast({
            type: 'success',
            message: 'Receipt photo captured! Ready for 3D neural scan.',
          });
        }}
      />
    </div>
  );
}

