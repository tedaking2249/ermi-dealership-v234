import { useEffect } from 'react';
import { FiMic, FiSend, FiTrash2 } from 'react-icons/fi';
import useVoiceRecorder, { MAX_VOICE_SECONDS } from '../../hooks/useVoiceRecorder';
import './Voice.css';

const formatClock = (total) => {
  const safe = Math.max(0, Math.floor(total));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

// The microphone button. While recording it covers the message bar with a timer,
// a delete button and a send button, like Telegram.
//   onSend(blob, seconds)  called when the user sends the recording
//   onError(message)       called when something goes wrong ('' clears the message)
//   hidden                 true while the user is typing, so only the send arrow shows
//   disabled               true while a voice message is uploading
function VoiceInput({ onSend, onError, hidden = false, disabled = false }) {
  const { supported, recording, seconds, start, stop, cancel, minSeconds } = useVoiceRecorder();

  const handleStart = async () => {
    onError?.('');
    const problem = await start();
    if (problem) onError?.(problem);
  };

  const handleSend = async () => {
    const result = await stop();
    if (!result) return;
    if (result.seconds < minSeconds) {
      onError?.('The recording was too short. Tap the microphone and speak for a little longer.');
      return;
    }
    onSend(result.blob, result.seconds);
  };

  // Stop by itself at the time limit and send what was recorded
  useEffect(() => {
    if (recording && seconds >= MAX_VOICE_SECONDS) handleSend();
  }, [recording, seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!supported) return null;

  return (
    <>
      {!hidden && !recording && (
        <button
          type="button"
          className="voice-mic-btn"
          onClick={handleStart}
          disabled={disabled}
          aria-label="Record a voice message"
          title="Record a voice message"
        >
          <FiMic />
        </button>
      )}

      {recording && (
        <div className="voice-recording-bar" role="group" aria-label="Recording a voice message">
          <button
            type="button"
            className="voice-cancel-btn"
            onClick={() => { cancel(); onError?.(''); }}
            aria-label="Delete recording"
          >
            <FiTrash2 />
          </button>
          <span className="voice-rec-dot" aria-hidden="true" />
          <span className="voice-rec-time" aria-live="off">
            {formatClock(seconds)} <small>/ {formatClock(MAX_VOICE_SECONDS)}</small>
          </span>
          <span className="voice-rec-hint">Recording...</span>
          <button type="button" className="voice-send-btn" onClick={handleSend} aria-label="Send voice message">
            <FiSend />
          </button>
        </div>
      )}
    </>
  );
}

export default VoiceInput;