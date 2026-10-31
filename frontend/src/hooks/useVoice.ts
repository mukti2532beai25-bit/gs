import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  analyser: AnalyserNode | null;
}

export function useVoice(language: string = 'en') {
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
  const isStartingRef = useRef<boolean>(false);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    setState((s) => ({ ...s, isSupported: !!SpeechRecognition }));

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Set correct language locale tag
    const langTag = language === 'hi' ? 'hi-IN' : language === 'pa' ? 'pa-IN' : 'en-IN';
    recognition.lang = langTag;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setState((s) => ({
        ...s,
        transcript: final ? (s.transcript ? `${s.transcript} ${final}` : final) : s.transcript,
        interimTranscript: interim,
      }));
    };

    recognition.onerror = (event: any) => {
      console.warn('[useVoice] Speech recognition error:', event.error);
      let errMsg = `Voice recognition error: ${event.error}`;

      if (event.error === 'not-allowed') {
        errMsg = 'Microphone permission denied. Please allow microphone access in browser settings.';
      } else if (event.error === 'no-speech') {
        errMsg = 'No speech detected. Please speak clearly into the microphone.';
      } else if (event.error === 'audio-capture') {
        errMsg = 'Microphone capture failed. Please check your audio input device.';
      }

      // Stop media tracks immediately if permission denied or capture failed
      if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        setState((s) => ({
          ...s,
          isListening: false,
          error: errMsg,
          analyser: null,
        }));
      } else {
        setState((s) => ({ ...s, error: errMsg }));
      }
    };

    recognition.onend = () => {
      // If recognition stopped naturally
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
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    // Reset transcripts and error first, but do NOT set isListening to true yet
    setState((s) => ({
      ...s,
      error: null,
      transcript: '',
      interimTranscript: '',
    }));

    let stream: MediaStream | null = null;

    // 1. Acquire real microphone stream via navigator.mediaDevices.getUserMedia
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaStreamRef.current = stream;

        // Initialize Web Audio API AnalyserNode
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64; // 32 frequency buckets for 3D waveform
          analyser.smoothingTimeConstant = 0.8;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;
        }
      } else {
        throw new Error('navigator.mediaDevices.getUserMedia is not supported on this browser.');
      }
    } catch (err: any) {
      isStartingRef.current = false;
      let errorMsg = 'Microphone access failed.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No microphone device found on this system.';
      } else {
        errorMsg = err.message || errorMsg;
      }

      // STRICT INVARIANT: Assistant must NOT pretend to be listening if access failed!
      setState((s) => ({
        ...s,
        isListening: false,
        error: errorMsg,
        analyser: null,
      }));
      return;
    }

    // 2. Start speech recognition engine
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setState((s) => ({
          ...s,
          isListening: true,
          error: null,
          analyser: analyserRef.current,
        }));
      } catch (err: any) {
        console.warn('[useVoice] Speech recognition start notice:', err);
        // If already started, ensure isListening reflects true state
        setState((s) => ({
          ...s,
          isListening: true,
          analyser: analyserRef.current,
        }));
      }
    } else {
      // Speech recognition not supported: still capture waveform if stream active, but notify
      setState((s) => ({
        ...s,
        isListening: false,
        error: 'SpeechRecognition API is not supported in this browser. Please use manual text entry.',
        analyser: null,
      }));
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    }

    isStartingRef.current = false;
  }, []);

  const stopListening = useCallback(() => {
    isStartingRef.current = false;

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
