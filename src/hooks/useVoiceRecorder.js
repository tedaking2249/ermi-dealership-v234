import { useState, useRef, useCallback, useEffect } from 'react';

export const MAX_VOICE_SECONDS = 120;
const MIN_VOICE_SECONDS = 1;

// Browsers record in different formats: Chrome and Firefox use webm, Safari on iPhone uses mp4.
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

const pickMimeType = () => {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || '';
};

const describeMicError = (err) => {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
    return 'Microphone access is blocked. Allow the microphone for this site in your browser settings, then try again.';
  }
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
    return 'No microphone was found on this device.';
  }
  if (err?.name === 'NotReadableError') {
    return 'The microphone is being used by another app. Close it and try again.';
  }
  return 'Could not start the recording. Please try again.';
};

function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);

  const supported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setSeconds(0);
  }, []);

  // Returns '' when recording started, otherwise a message that explains what went wrong
  const start = useCallback(async () => {
    if (!supported) return 'Voice messages are not supported in this browser.';
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      return 'The microphone only works on https or localhost. Open the site on a secure address.';
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start();
      recorderRef.current = recorder;

      startedAtRef.current = Date.now();
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
      return '';
    } catch (err) {
      cleanup();
      return describeMicError(err);
    }
  }, [supported, cleanup]);

  // Stops and returns { blob, seconds }, or null when there is nothing to send
  const stop = useCallback(
    () =>
      new Promise((resolve) => {
        const recorder = recorderRef.current;
        if (!recorder || recorder.state === 'inactive') {
          cleanup();
          resolve(null);
          return;
        }
        recorder.onstop = () => {
          const length = Math.round((Date.now() - startedAtRef.current) / 1000);
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          cleanup();
          resolve(blob.size > 0 ? { blob, seconds: length } : null);
        };
        recorder.stop();
      }),
    [cleanup]
  );

  // Throws the recording away
  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    cleanup();
  }, [cleanup]);

  // If the chat closes while recording, release the microphone
  useEffect(() => cancel, [cancel]);

  return { supported, recording, seconds, start, stop, cancel, minSeconds: MIN_VOICE_SECONDS };
}

export default useVoiceRecorder;