import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  analyser: AnalyserNode | null;
}

export function useVoice(language: string = 'en-IN') {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    isSupported: false,
    error: null,
    analyser: null,
  });

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setState((s) => ({ ...s, isSupported: !!SpeechRecognition }));

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'pa' ? 'pa-IN' : 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      setState((s) => ({
        ...s,
        transcript: s.transcript ? `${s.transcript} ${final}` : final,
        interimTranscript: interim,
      }));
    };

    recognition.onerror = (event: any) => {
      setState((s) => ({
        ...s,
        error:
          event.error === 'not-allowed'
            ? 'Microphone permission denied. Please allow microphone access in browser settings.'
            : `Voice error: ${event.error}`,
        isListening: false,
      }));
    };

    recognition.onend = () => {
      setState((s) => ({ ...s, isListening: false, interimTranscript: '' }));
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch {}
    };
  }, [language]);

  // Clean up audio graph on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    setState((s) => ({
      ...s,
      isListening: true,
      error: null,
      transcript: '',
      interimTranscript: '',
    }));

    // 1. Initialize real Web Audio API AnalyserNode if audio devices supported
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64; // produces 32 frequency buckets
          analyser.smoothingTimeConstant = 0.8;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;
          setState((s) => ({ ...s, analyser }));
        }
      }
    } catch (err: any) {
      console.warn('Microphone stream access unavailable for visualizer:', err);
    }

    // 2. Start speech recognition engine
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        console.warn('Speech recognition start failed or already active:', err);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setState((s) => ({ ...s, isListening: false, analyser: null }));
  }, []);

  const clearTranscript = useCallback(() => {
    setState((s) => ({ ...s, transcript: '', interimTranscript: '' }));
  }, []);

  return { ...state, startListening, stopListening, clearTranscript };
}
