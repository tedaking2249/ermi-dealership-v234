import { useRef, useState } from 'react';
import { FiPlay, FiPause } from 'react-icons/fi';
import './Voice.css';

// Only one voice message plays at a time
let activeAudio = null;

const formatClock = (total) => {
  const safe = Math.max(0, Math.floor(Number(total) || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};

// The play button, progress bar and length shown inside a chat bubble.
// It uses the bubble's own text color, so it fits any bubble color.
function VoiceMessage({ url, duration }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(Number(duration) || 0);
  const [failed, setFailed] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (activeAudio && activeAudio !== audio) activeAudio.pause();
      activeAudio = audio;
      audio.play().catch(() => setFailed(true));
    } else {
      audio.pause();
    }
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    const value = Number(event.target.value);
    if (audio) audio.currentTime = value;
    setCurrent(value);
  };

  if (!url || failed) {
    return <p className="voice-unavailable">This voice message could not be played.</p>;
  }

  const max = total > 0 ? total : Math.max(current, 1);

  return (
    <div className="voice-message">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const length = e.currentTarget.duration;
          if (Number.isFinite(length) && length > 0) setTotal(length);
        }}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        className="voice-play-btn"
        onClick={toggle}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
      >
        {playing ? <FiPause /> : <FiPlay />}
      </button>
      <div className="voice-track">
        <input
          type="range"
          className="voice-range"
          min="0"
          max={max}
          step="0.1"
          value={Math.min(current, max)}
          onChange={handleSeek}
          style={{ '--voice-progress': `${(Math.min(current, max) / max) * 100}%` }}
          aria-label="Voice message position"
        />
        <span className="voice-time">{playing || current > 0 ? formatClock(current) : formatClock(total)}</span>
      </div>
    </div>
  );
}

export default VoiceMessage;