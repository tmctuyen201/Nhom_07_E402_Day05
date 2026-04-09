/**
 * useTTS — Text-to-Speech via OpenAI TTS API (tts-1-hd, shimmer voice).
 * Falls back to Web Speech Synthesis if API call fails.
 */
import { useState, useCallback, useRef } from 'react';

interface UseTTSOptions {
  apiKey: string;
  voice?: string;
  enabled?: boolean;
}

/** Frontend pre-clean — remove obvious noise before sending to backend */
function preclean(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')          // markdown images
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // links → text only
    .replace(/```[\s\S]*?```/g, '')            // code blocks
    .replace(/`[^`]+`/g, '')                   // inline code
    .replace(/#{1,6}\s+/g, '')                 // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1')         // bold
    .replace(/\*([^*]+)\*/g, '$1')             // italic
    .replace(/https?:\/\/\S+/g, '')            // URLs
    .replace(/[_~|]/g, '')                     // misc markdown
    .trim()
    .slice(0, 600); // keep it short for faster TTS
}

export function useTTS({ apiKey, voice = 'shimmer', enabled = true }: UseTTSOptions) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!enabled || !text.trim()) return;
    stop();

    const cleaned = preclean(text);
    if (!cleaned) return;

    setIsSpeaking(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ text: cleaned, voice }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`TTS ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => { URL.revokeObjectURL(url); setIsSpeaking(false); };
      audio.onerror = () => { URL.revokeObjectURL(url); setIsSpeaking(false); };

      await audio.play();
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        setIsSpeaking(false);
        return;
      }
      // Fallback: Web Speech Synthesis
      _webSpeechFallback(cleaned, () => setIsSpeaking(false));
    }
  }, [apiKey, voice, enabled, stop]);

  return { isSpeaking, speak, stop };
}

function _webSpeechFallback(text: string, onEnd: () => void) {
  if (!window.speechSynthesis) { onEnd(); return; }

  // Pick best Vietnamese voice if available
  const voices = window.speechSynthesis.getVoices();
  const viVoice = voices.find(v => v.lang.startsWith('vi')) ?? null;

  const utt = new SpeechSynthesisUtterance(text.slice(0, 300));
  utt.lang = 'vi-VN';
  utt.rate = 0.95;
  utt.pitch = 1.0;
  if (viVoice) utt.voice = viVoice;
  utt.onend = onEnd;
  utt.onerror = onEnd;
  window.speechSynthesis.speak(utt);
}
