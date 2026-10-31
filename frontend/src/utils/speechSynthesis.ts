/**
 * BahiVerse AI — Text-to-Speech (TTS) Voice Synthesis Service
 * Speaks assistant answers in English, Hindi, or Punjabi using Web SpeechSynthesis
 */

export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/[#*_`~>-]/g, '') // remove markdown markup
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // link formatting [text](url) -> text
    .replace(/₹/g, ' rupees ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakText(
  text: string,
  language: string = 'en',
  options: { enabled?: boolean; onStart?: () => void; onEnd?: () => void } = {}
): void {
  const { enabled = true, onStart, onEnd } = options;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[TTS] SpeechSynthesis is not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  if (!enabled) return;

  const clean = cleanTextForSpeech(text);
  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);

  // Set language tag
  const langTag =
    language === 'hi' ? 'hi-IN' : language === 'pa' ? 'pa-IN' : 'en-IN';
  utterance.lang = langTag;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Try to find matching voice for target language
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice =
    voices.find((v) => v.lang.toLowerCase().startsWith(langTag.toLowerCase().slice(0, 2))) ||
    voices.find((v) => v.lang.includes('IN')) ||
    voices[0];

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
