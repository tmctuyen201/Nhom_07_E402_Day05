/**
 * useWakeWord — Polling-based wake word detection.
 *
 * Instead of continuous mode (which Chrome kills after ~60s silence),
 * we run short 3-second recognition bursts in a loop.
 * Each burst: start → listen 3s → check for wake word → restart.
 * This is far more stable than continuous mode.
 */
import { useState, useRef, useEffect } from 'react';

const BURST_DURATION_MS = 3000;   // how long each listening burst lasts
const RESTART_DELAY_MS  = 200;    // gap between bursts

function matchesWakeWord(text: string): boolean {
  const t = text.toLowerCase().trim();

  const exact = [
    'hey vinfast', 'hey vin fast', 'vin fast', 'vinfast',
    'xin chào vinfast', 'vinfast ơi', 'vin fast ơi',
    'hey win fast', 'win fast', 'vin phát', 'win phát',
    'hey vin', 'oi vinfast',
  ];
  if (exact.some(p => t.includes(p))) return true;

  // Fuzzy: "vin/win" + "fast/phát"
  const hasVin  = /\b(vin|win|bin)\b/.test(t);
  const hasFast = /\b(fast|phát|phat|fax)\b/.test(t);
  return hasVin && hasFast;
}

interface UseWakeWordOptions {
  enabled: boolean;
  onWake: () => void;
}

export function useWakeWord({ enabled, onWake }: UseWakeWordOptions) {
  const [isActive, setIsActive] = useState(false);

  const enabledRef  = useRef(enabled);
  const onWakeRef   = useRef(onWake);
  const recogRef    = useRef<SpeechRecognition | null>(null);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeTriggeredRef = useRef(false);

  enabledRef.current = enabled;
  onWakeRef.current  = onWake;

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // ── Core: run one burst ───────────────────────────────────
  const runBurst = useRef<() => void>(() => {});

  useEffect(() => {
    if (!isSupported) return;

    const clearTimer = () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };

    const stopCurrent = () => {
      clearTimer();
      if (recogRef.current) {
        try { recogRef.current.abort(); } catch { /* ignore */ }
        recogRef.current = null;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      if (enabledRef.current && !document.hidden) {
        timerRef.current = setTimeout(() => runBurst.current(), RESTART_DELAY_MS);
      } else {
        setIsActive(false);
      }
    };

    runBurst.current = () => {
      if (!enabledRef.current || document.hidden) {
        setIsActive(false);
        return;
      }
      if (recogRef.current) return; // already running

      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog: SpeechRecognition = new SR();
      recog.lang = 'vi-VN';
      recog.continuous = false;      // single utterance per burst
      recog.interimResults = false;  // only final results — more reliable
      recog.maxAlternatives = 5;     // check more alternatives

      wakeTriggeredRef.current = false;

      recog.onstart = () => setIsActive(true);

      recog.onresult = (e: SpeechRecognitionEvent) => {
        for (let i = 0; i < e.results.length; i++) {
          for (let j = 0; j < e.results[i].length; j++) {
            const text = e.results[i][j].transcript;
            if (matchesWakeWord(text)) {
              wakeTriggeredRef.current = true;
              recogRef.current = null;
              setIsActive(false);
              onWakeRef.current();
              // Don't restart immediately — wait for voice input to finish
              timerRef.current = setTimeout(() => runBurst.current(), 4000);
              return;
            }
          }
        }
      };

      recog.onerror = (e: SpeechRecognitionErrorEvent) => {
        recogRef.current = null;
        if (e.error === 'not-allowed') {
          setIsActive(false);
          return; // no mic permission — stop completely
        }
        // network/audio errors — retry after longer delay
        const delay = e.error === 'network' ? 3000 : RESTART_DELAY_MS;
        timerRef.current = setTimeout(() => runBurst.current(), delay);
      };

      recog.onend = () => {
        recogRef.current = null;
        if (!wakeTriggeredRef.current) {
          scheduleNext();
        }
      };

      recogRef.current = recog;

      // Auto-stop burst after BURST_DURATION_MS to force restart
      timerRef.current = setTimeout(() => {
        if (recogRef.current === recog) {
          try { recog.stop(); } catch { /* ignore */ }
        }
      }, BURST_DURATION_MS);

      try {
        recog.start();
      } catch {
        recogRef.current = null;
        scheduleNext();
      }
    };

    // Expose stop
    return () => {
      stopCurrent();
      setIsActive(false);
    };
  }, [isSupported]);

  // ── React to enabled toggle ───────────────────────────────
  useEffect(() => {
    if (!isSupported) return;
    if (enabled) {
      runBurst.current();
    } else {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      if (recogRef.current) { try { recogRef.current.abort(); } catch { /* ignore */ } recogRef.current = null; }
      setIsActive(false);
    }
  }, [enabled, isSupported]);

  // ── Pause on tab hide, resume on show ────────────────────
  useEffect(() => {
    if (!isSupported) return;
    const onVisibility = () => {
      if (document.hidden) {
        if (recogRef.current) { try { recogRef.current.abort(); } catch { /* ignore */ } recogRef.current = null; }
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        setIsActive(false);
      } else if (enabledRef.current) {
        timerRef.current = setTimeout(() => runBurst.current(), 500);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isSupported]);

  return { isActive, isSupported };
}
