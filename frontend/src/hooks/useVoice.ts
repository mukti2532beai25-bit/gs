import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
}

export function useVoice(language: string = 'en-IN') {
  const [state, setState] = useState<VoiceState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    isSupported: false,
    error: null,
  });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setState(s => ({ ...s, isSupported: !!SpeechRecognition }));

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
      setState(s => ({
        ...s,
        transcript: s.transcript + final,
        interimTranscript: interim,
      }));
    };

    recognition.onerror = (event: any) => {
      setState(s => ({
        ...s,
        error: event.error === 'not-allowed'
          ? 'Microphone permission denied. Please allow microphone access.'
          : `Voice error: ${event.error}`,
        isListening: false,
      }));
    };

    recognition.onend = () => {
      setState(s => ({ ...s, isListening: false, interimTranscript: '' }));
    };

    recognitionRef.current = recognition;
    return () => { recognition.abort(); };
  }, [language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setState(s => ({ ...s, isListening: true, error: null, transcript: '', interimTranscript: '' }));
    recognitionRef.current.start();
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setState(s => ({ ...s, isListening: false }));
  }, []);

  const clearTranscript = useCallback(() => {
    setState(s => ({ ...s, transcript: '', interimTranscript: '' }));
  }, []);

  return { ...state, startListening, stopListening, clearTranscript };
}
