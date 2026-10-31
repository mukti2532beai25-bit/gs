import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { billsApi } from '../services/api';
import ScanningPortal3D from '../components/3d/ScanningPortal3D';
import {
  Upload,
  Camera,
  FileImage,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { LANGUAGE_LABELS } from '../utils/formatters';

export default function CaptureBill() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi' | 'pa'>('hi');
  const [isUploading, setIsUploading] = useState(false);
  const [scanStep, setScanStep] = useState<string>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProcessScan = async () => {
    if (!selectedFile) {
      addToast({ type: 'warning', message: 'Please select or capture a bill image first.' });
      return;
    }

    setIsUploading(true);
    setScanStep('Preprocessing & De-skewing image...');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('language', language);

      setTimeout(() => setScanStep('Running OCR and detecting handwritten script...'), 600);
      setTimeout(() => setScanStep('Normalizing line items against shop vocabulary...'), 1200);

      const res = await billsApi.capture(formData);

      addToast({
        type: 'success',
        message: res.extraction?.isDemo
          ? 'Bill captured! Demo OCR extracted structured data.'
          : 'Bill captured and processed successfully!',
      });

      // Navigate to review page
      navigate(`/review/${res.bill.id}`);
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to capture bill' });
      setIsUploading(false);
      setScanStep('idle');
    }
  };

  // Instant Sample Bill load for quick testing
  const handleLoadSampleBill = async () => {
    setIsUploading(true);
    setScanStep('Loading simulated handwritten shop receipt...');

    try {
      const formData = new FormData();
      formData.append('language', language);

      const res = await billsApi.capture(formData);
      addToast({ type: 'success', message: 'Sample bill generated and parsed!' });
      navigate(`/review/${res.bill.id}`);
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-medium mb-2">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          Module 02 — Multi-Modal Capture
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Capture & Scan Handwritten Bill
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload phone photos, scan documents, or load receipts in Hindi, English, and Punjabi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 3D Scanning Portal Viewport */}
        <div className="lg:col-span-5 glass-panel p-6 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              3D Holographic Reticle
            </span>
          </div>

          <div className="w-full h-80">
            <ScanningPortal3D isScanning={isUploading} />
          </div>

          <div className="w-full text-center mt-2 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-400">
              {isUploading ? (
                <span className="text-cyan-400 font-mono flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {scanStep}
                </span>
              ) : (
                'Laser sweep & perspective normalization ready'
              )}
            </p>
          </div>
        </div>

        {/* Right: Upload & Parameters Control */}
        <div className="lg:col-span-7 space-y-6">
          {/* Language Selection */}
          <div className="glass-panel p-5">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
              Select OCR Script & Language Hint
            </label>
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

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
              previewUrl
                ? 'border-cyan-500/40 bg-cyan-950/10'
                : 'border-white/10 hover:border-cyan-500/30 bg-white/[0.02]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-xl overflow-hidden border border-cyan-400/30 shadow-lg relative">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-100">{selectedFile?.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {(selectedFile?.size ? (selectedFile.size / (1024 * 1024)).toFixed(2) : '0')} MB • Click to replace
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Click to select bill or drag & drop photo
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports JPG, PNG, WEBP, HEIC, or PDF up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleProcessScan}
              disabled={!selectedFile || isUploading}
              className="btn-primary flex-1 justify-center py-3.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Neural Scan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run 3D AI Extraction</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLoadSampleBill}
              disabled={isUploading}
              className="btn-secondary py-3.5 px-5 text-sm justify-center"
            >
              <span>Instant Sample Receipt</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Informational Hint */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-400 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Intelligent Pre-processing:</span>{' '}
              BahiVerse automatically applies lighting correction, contrast equalization, and dialect
              matching based on your store's vocabulary before structuring line items.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
