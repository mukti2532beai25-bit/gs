import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  X,
  Check,
  RotateCcw,
  AlertCircle,
  Upload,
  SwitchCamera,
  Sparkles,
} from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function CameraScannerModal({
  isOpen,
  onClose,
  onCapture,
}: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedBlobUrl, setCapturedBlobUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);

  // Stop all camera media tracks
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera with getUserMedia
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopCameraStream();
    setCameraError(null);
    setIsLoadingCamera(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsLoadingCamera(false);
      setCameraError('Camera access (getUserMedia) is not supported by your browser.');
      return;
    }

    try {
      // Check available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {}

      // Request stream with high resolution for crisp bill OCR text
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoadingCamera(false);
    } catch (err: any) {
      setIsLoadingCamera(false);
      console.warn('[CameraScanner] Camera access error:', err);

      let msg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser or use file upload.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this system. Please connect a webcam or use file upload.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is currently in use by another application or browser tab.';
      } else if (err.name === 'OverconstrainedError') {
        // Fallback to basic video constraint without facingMode or resolution limits
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
          }
          setIsLoadingCamera(false);
          return;
        } catch {
          msg = 'Camera resolution requirements not supported by device.';
        }
      } else {
        msg = err.message || msg;
      }

      setCameraError(msg);
    }
  }, [stopCameraStream]);

  // Start camera when modal opens, stop when closes
  useEffect(() => {
    if (isOpen) {
      setCapturedBlobUrl(null);
      setCapturedFile(null);
      startCamera(facingMode);
    } else {
      stopCameraStream();
      if (capturedBlobUrl) {
        URL.revokeObjectURL(capturedBlobUrl);
        setCapturedBlobUrl(null);
      }
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode, startCamera, stopCameraStream]);

  // Switch between front and rear cameras
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Shutter action: take snapshot from video element
  const captureSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const fileName = `camera-bill-${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        setCapturedBlobUrl(blobUrl);
        setCapturedFile(file);
        stopCameraStream();
      },
      'image/jpeg',
      0.95
    );
  };

  // Retake photo: discard snapshot and restart camera
  const handleRetake = () => {
    if (capturedBlobUrl) {
      URL.revokeObjectURL(capturedBlobUrl);
      setCapturedBlobUrl(null);
    }
    setCapturedFile(null);
    startCamera(facingMode);
  };

  // Confirm photo: pass captured file to parent handler
  const handleConfirm = () => {
    if (capturedFile) {
      stopCameraStream();
      onCapture(capturedFile);
      onClose();
    }
  };

  // Handle modal exit
  const handleClose = () => {
    stopCameraStream();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Live Bill Camera Scanner
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {capturedBlobUrl ? 'Preview' : 'Active'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Align handwritten bill or receipt within the scanning frame
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!capturedBlobUrl && (
              <button
                type="button"
                onClick={toggleCameraFacing}
                title="Switch Camera (Front/Back)"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative w-full h-[380px] sm:h-[440px] bg-black flex items-center justify-center overflow-hidden">
          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* 1. Captured Photo Preview Mode */}
          {capturedBlobUrl ? (
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
              <img
                src={capturedBlobUrl}
                alt="Captured receipt snapshot"
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-1.5 backdrop-blur-md">
                <Check className="w-3.5 h-3.5" /> Photo Captured
              </div>
            </div>
          ) : cameraError ? (
            /* 2. Error State */
            <div className="p-6 text-center max-w-md space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-200">Camera Unavailable</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{cameraError}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="btn-ghost py-2 px-4 text-xs font-semibold text-cyan-400"
                >
                  Use File Upload Instead
                </button>
              </div>
            </div>
          ) : (
            /* 3. Live Video Stream Mode */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Scanning Reticle & Overlay Guide */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-emerald-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3 shadow-glow-emerald">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-400" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-400" />
                </div>
                <div className="text-center font-mono text-[11px] text-emerald-300 bg-slate-950/70 px-3 py-1 rounded-full self-center border border-emerald-500/30">
                  Align bill inside reticle
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>

              {isLoadingCamera && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-xs font-mono text-cyan-400">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Connecting camera sensor...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-white/10 flex items-center justify-between gap-4">
          {capturedBlobUrl ? (
            /* Retake / Confirm Controls */
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Retake Photo
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2 shadow-glow-emerald"
              >
                <Check className="w-4 h-4 text-slate-950" />
                <span>Use This Photo</span>
              </button>
            </div>
          ) : (
            /* Live Capture Button Controls */
            <div className="w-full flex items-center justify-between">
              <div className="text-xs text-slate-400 font-mono hidden sm:block">
                Mode: {facingMode === 'environment' ? 'Rear Document Camera' : 'Front User Camera'}
              </div>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={captureSnapshot}
                disabled={isLoadingCamera || !!cameraError}
                className="mx-auto w-16 h-16 rounded-full border-4 border-emerald-400/80 bg-gradient-to-tr from-emerald-500 to-teal-400 hover:scale-105 active:scale-95 transition-all shadow-glow-emerald flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
                title="Capture Document Photo"
              >
                <div className="w-12 h-12 rounded-full bg-slate-950/40 border border-white/40 flex items-center justify-center text-white">
                  <Camera className="w-6 h-6 text-emerald-200" />
                </div>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-slate-400 hover:text-white transition-colors hidden sm:block"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
