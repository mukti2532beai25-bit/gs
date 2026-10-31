import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Upload,
  RotateCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowRight,
  Maximize2,
  RefreshCw,
  SwitchCamera,
  Eye,
  FileText,
  Sliders,
} from 'lucide-react';
import { uploadBatchDocuments, triggerBatchProcessing } from '../services/documentApi';

interface ScannedPage {
  id: string;
  blob: Blob;
  previewUrl: string;
  rotation: number;
  fileName: string;
  enhanced: boolean;
}

export default function BatchScanner() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [edgeEnhance, setEdgeEnhance] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processingSummary, setProcessingSummary] = useState<{
    total: number;
    duplicates: number;
    processedIds: string[];
  } | null>(null);

  // Initialize camera when in camera mode
  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        'Live camera unavailable or permission denied. You can still use the multi-file batch uploader.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply auto edge-contrast enhancement filter if active
    if (edgeEnhance) {
      ctx.filter = 'contrast(1.15) brightness(1.05)';
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const pageId = `page-${Date.now()}-${pages.length + 1}`;
        const previewUrl = URL.createObjectURL(blob);
        const newPage: ScannedPage = {
          id: pageId,
          blob,
          previewUrl,
          rotation: 0,
          fileName: `BatchScan_Page_${pages.length + 1}.jpg`,
          enhanced: edgeEnhance,
        };
        setPages((prev) => [...prev, newPage]);
        setSelectedIndex(pages.length);
      },
      'image/jpeg',
      0.92
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPages: ScannedPage[] = Array.from(files).map((file, idx) => ({
      id: `page-${Date.now()}-${idx}`,
      blob: file,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
      fileName: file.name,
      enhanced: false,
    }));

    setPages((prev) => [...prev, ...newPages]);
    setSelectedIndex(pages.length);
  };

  const rotateCurrentPage = () => {
    if (pages.length === 0) return;
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === selectedIndex ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const removePage = (index: number) => {
    setPages((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (selectedIndex >= updated.length) {
        setSelectedIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const handleProcessBatch = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    setProcessProgress(15);

    try {
      const formData = new FormData();
      formData.append('sourceType', 'camera_batch');
      formData.append('sourceDetails', `Batch Scan with ${pages.length} pages`);

      pages.forEach((p) => {
        formData.append('documents', p.blob, p.fileName);
      });

      setProcessProgress(45);
      const uploadRes = await uploadBatchDocuments(formData);

      if (uploadRes.success) {
        setProcessProgress(70);
        const docIds = uploadRes.data.documents.map((d) => d.id);

        // Run batch OCR extraction
        const processRes = await triggerBatchProcessing(docIds);
        setProcessProgress(100);

        setProcessingSummary({
          total: uploadRes.data.totalUploaded,
          duplicates: uploadRes.data.duplicatesDetected,
          processedIds: docIds,
        });
      }
    } catch (err) {
      console.error('Batch upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-white/10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-glow-purple">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Batch Document Scanner
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                Multi-Page Ingestion
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Capture multi-page receipts, mandi parchas, and invoice batches with automatic perspective simulation & duplicate protection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setMode('camera')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'camera'
                ? 'bg-purple-500 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Live Camera
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'upload'
                ? 'bg-purple-500 text-white shadow-glow-purple'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Multi-File Drop
          </button>
        </div>
      </div>

      {/* Main Scanner Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Viewfinder or Drag & Drop */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center">
            {mode === 'camera' ? (
              isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Optical Document Framing Overlay */}
                  <div className="absolute inset-8 border-2 border-dashed border-purple-400/50 rounded-xl pointer-events-none flex flex-col justify-between p-4">
                    <div className="flex justify-between">
                      <span className="w-4 h-4 border-t-2 border-l-2 border-purple-400" />
                      <span className="w-4 h-4 border-t-2 border-r-2 border-purple-400" />
                    </div>
                    <div className="flex justify-between">
                      <span className="w-4 h-4 border-b-2 border-l-2 border-purple-400" />
                      <span className="w-4 h-4 border-b-2 border-r-2 border-purple-400" />
                    </div>
                  </div>

                  {/* Top Floating Controls */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs text-white border border-white/10 font-mono">
                      Queue: {pages.length} Pages
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEdgeEnhance(!edgeEnhance)}
                        className={`p-2 rounded-xl backdrop-blur-md border text-xs flex items-center gap-1.5 transition-all ${
                          edgeEnhance
                            ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                            : 'bg-black/60 border-white/10 text-slate-400'
                        }`}
                        title="Auto Document Contrast"
                      >
                        <Sliders className="w-4 h-4" />
                        <span className="hidden sm:inline">Auto-Enhance</span>
                      </button>

                      <button
                        onClick={() =>
                          setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                        }
                        className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-colors"
                        title="Switch Camera"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Shutter Button */}
                  <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center">
                    <button
                      onClick={captureFrame}
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-1 shadow-glow-purple hover:scale-105 active:scale-95 transition-all"
                    >
                      <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 max-w-md">
                  <Camera className="w-12 h-12 mx-auto text-purple-400 mb-4 opacity-50" />
                  <p className="text-white font-semibold mb-2">Camera Inactive</p>
                  <p className="text-xs text-slate-400 mb-4">
                    {cameraError || 'Click below to grant camera permissions for live batch scanning.'}
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-semibold hover:bg-purple-600 transition-colors"
                  >
                    Activate Camera
                  </button>
                </div>
              )
            ) : (
              /* Drag & Drop Mode */
              <label className="w-full h-full flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white/5 transition-colors border-2 border-dashed border-white/20 rounded-2xl">
                <Upload className="w-12 h-12 text-purple-400 mb-3" />
                <p className="text-base font-bold text-white">Drop Multiple Invoices & Receipts</p>
                <p className="text-xs text-slate-400 mt-1">Select multiple PNG, JPG, or PDF files at once</p>
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Right Column: Scanned Page Queue & Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 shadow-xl flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Batch Document Queue
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono">
                  {pages.length} Pages
                </span>
              </h2>

              {pages.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={rotateCurrentPage}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Rotate 90° Clockwise"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removePage(selectedIndex)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                    title="Remove Selected Page"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Selected Page Active Preview */}
            <div className="flex-1 my-3 bg-black/40 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center p-2 relative">
              {pages.length > 0 && pages[selectedIndex] ? (
                <img
                  src={pages[selectedIndex].previewUrl}
                  alt={`Scanned page ${selectedIndex + 1}`}
                  style={{ transform: `rotate(${pages[selectedIndex].rotation}deg)` }}
                  className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-300"
                />
              ) : (
                <div className="text-center text-slate-500 text-xs">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No pages captured in this batch yet.
                </div>
              )}
            </div>

            {/* Thumbnails Filmstrip */}
            {pages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-2 border-t border-white/10">
                {pages.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      idx === selectedIndex
                        ? 'border-purple-400 scale-105 shadow-glow-purple'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={p.previewUrl}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center font-mono">
                      #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-3 border-t border-white/10">
              <button
                onClick={handleProcessBatch}
                disabled={pages.length === 0 || isProcessing}
                className={`w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                  pages.length > 0 && !isProcessing
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-glow-purple hover:brightness-110 active:scale-95'
                    : 'bg-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing OCR on Batch ({processProgress}%)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Process Batch ({pages.length} Pages) into Inbox
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal / Summary Card */}
      {processingSummary && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Batch Ingested Successfully!</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {processingSummary.total} pages uploaded • {processingSummary.duplicates} duplicate flags detected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPages([]);
                setProcessingSummary(null);
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold transition-colors"
            >
              Scan Another Batch
            </button>
            <button
              onClick={() => navigate('/inbox')}
              className="px-5 py-2.5 rounded-xl bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-glow-purple hover:bg-purple-600 transition-colors"
            >
              View Document Inbox
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
