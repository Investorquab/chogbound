import type { VoiceClass } from 'chogbound-sim/src/types.js';

/** Speech settings per Chog voice class. Browser speech is free and needs no files; each class gets its own pitch and pace. */
export const VOICE_PROFILES: Record<VoiceClass, { pitch: number; rate: number }> = {
  fierce: { pitch: 0.7, rate: 1.05 },
  smug: { pitch: 1.1, rate: 0.9 },
  hustler: { pitch: 1.0, rate: 1.2 },
  hungry: { pitch: 1.25, rate: 1.1 },
  gloom: { pitch: 0.55, rate: 0.8 },
  neutral: { pitch: 1.0, rate: 1.0 },
};
export const VOICE_STORAGE_KEY = 'chogbound.voice';
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}
/** Speak one line, cancelling whatever is still playing so lines never pile up. */
export function speak(text: string, voice: VoiceClass): void {
  if (!isSpeechSupported() || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const profile = VOICE_PROFILES[voice] ?? VOICE_PROFILES.neutral;
  utterance.pitch = profile.pitch; utterance.rate = profile.rate; utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}
export function stopSpeaking(): void { if (isSpeechSupported()) window.speechSynthesis.cancel(); }
