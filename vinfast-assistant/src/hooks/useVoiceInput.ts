/**
 * useVoiceInput — Web Speech API STT for capturing a single query.
 */
import { useState, useCallback, useRef } from 'react';

interface UseVoiceInputOptions {
  lang?: string;
  onTranscript: (text: string) => void;
  onError?: (err: string) => void;
}

export function useVoiceInput({
  lang = 'vi-VN',
  onTranscript,
  onError,
}: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recogRef = useRef<SpeechRecognition | null>(null);

  // Stable refs so callbacks don't cause stale closures
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  onTranscriptRef.current = onTranscript;
  onErrorRef.current = onError;

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    recogRef.current = null;
    setIsListening(false);
    setInterim('');
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      onErrorRef.current?.('Trình duyệt không hỗ trợ nhận dạng giọng nói. Dùng Chrome hoặc Edge.');
      return;
    }
    if (isListening) { stop(); return; }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog: SpeechRecognition = new SR();
    recog.lang = lang;
    recog.interimResults = true;
    recog.maxAlternatives = 3;
    recog.continuous = false;

    recog.onstart = () => setIsListening(true);

    recog.onresult = (e: SpeechRecognitionEvent) => {
      let final = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interimText += t;
      }
      setInterim(interimText);
      if (final) {
        setInterim('');
        recogRef.current = null;
        setIsListening(false);
        onTranscriptRef.current(final.trim());
      }
    };

    recog.onerror = (e: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setInterim('');
      recogRef.current = null;
      if (e.error !== 'aborted') onErrorRef.current?.(e.error);
    };

    recog.onend = () => {
      setIsListening(false);
      setInterim('');
      recogRef.current = null;
    };

    recogRef.current = recog;
    recog.start();
  }, [isSupported, isListening, lang, stop]);

  return { isListening, interim, start, stop, isSupported };
}
