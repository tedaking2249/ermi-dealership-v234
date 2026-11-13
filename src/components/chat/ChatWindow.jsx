import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiMoreVertical, FiPaperclip, FiSend, FiTrash2, FiSlash } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useVehicles } from '../../context/VehicleContext';
import useMessages from '../../hooks/useMessages';
import VoiceInput from './VoiceInput';
import VoiceMessage from './VoiceMessage';
import { uploadVoice } from '../../services/voice';
import { getErrorMessage } from '../../services/api';
import './ChatWindow.css';

const QUICK_REPLIES = ['Is it still available?', 'Test drive?', 'Final price?'];

function initials(label) {
  const words = String(label || '?').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatTime(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(timestamp) {
  if (!timestamp?.toDate) return '';
  const date = timestamp.toDate();
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function sameDay(a, b) {
  if (!a?.toDate || !b?.toDate) return false;
  return a.toDate().toDateString() === b.toDate().toDateString();
}

function ChatWindow({ conversationId, conversationLabel, onBack, quickReplies = QUICK_REPLIES }) {
  const { user } = useAuth();
  const { conversations, sendMessage, sendVoiceMessage, markRead, unreadOf, deleteMessage } = useChat();
  const { vehicles } = useVehicles();
  const messages = useMessages(conversationId);
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [confirmMsg, setConfirmMsg] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const isStaff = user?.role === 'admin';
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const unread = conversation ? unreadOf(conversation) : 0;
  const vehicle = vehicles.find((v) => String(v.id) === String(conversation?.vehicleId));
  const vehicleTitle = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : conversation?.vehicleName || '';
  const vehiclePrice = vehicle ? `ETB ${Number(vehicle.price).toLocaleString()}` : '';
  const vehicleImage = vehicle?.image || vehicle?.photos?.[0] || '';

  useEffect(() => {
    if (unread > 0) markRead(conversationId);
  }, [unread, conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // Focus the input field after a short delay to allow DOM to render
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [messages, conversationId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    sendMessage(conversationId, clean);
    setText('');
    // Focus input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleVoice = async (blob, seconds) => {
    setVoiceError('');
    setVoiceBusy(true);
    try {
      const uploaded = await uploadVoice(blob);
      const saved = await sendVoiceMessage(conversationId, uploaded.url, uploaded.duration || seconds);
      if (!saved) setVoiceError('The voice message was uploaded but could not be sent. Please try again.');
    } catch (err) {
      setVoiceError(getErrorMessage(err, 'Could not send the voice message. Please try again.'));
    } finally {
      setVoiceBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirmMsg || deleting) return;
    setDeleting(true);
    const idx = messages.findIndex((m) => m.id === confirmMsg.id);
    const ok = await deleteMessage(conversationId, confirmMsg, idx === messages.length - 1);
    setDeleting(false);
    setConfirmMsg(null);
    if (!ok) setVoiceError('Could not delete the message. Please try again.');
  };
  const handleQuickReply = (reply) => {
    setText(reply);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const canSend = text.trim().length > 0;

  return (
    <div className="chat-window tg-chat">
      <div className="tg-chat-header">
        <button type="button" className="tg-back-btn" onClick={handleBack} aria-label="Back">
          <FiArrowLeft />
        </button>
        <div className="tg-chat-avatar" aria-hidden="true">
          {initials(conversationLabel)}
          <span className="tg-online-dot" />
        </div>
        <div className="tg-chat-header-text">
          <h3>{conversationLabel || 'Conversation'}</h3>
          <span className="tg-chat-status">online</span>
        </div>
        <button type="button" className="tg-menu-btn" aria-label="Options">
          <FiMoreVertical />
        </button>
      </div>
      {vehicleTitle && (
        <div className="tg-vehicle-banner">
          {vehicleImage && <img src={vehicleImage} alt={vehicleTitle} className="tg-vehicle-thumb" />}
          <div className="tg-vehicle-info">
            <strong>{vehicleTitle}</strong>
            {vehiclePrice && <span>{vehiclePrice}</span>}
          </div>
          {vehicle && (
            <Link to={`/inventory/${vehicle.id}`} className="tg-view-car-btn">
              View car
            </Link>
          )}
        </div>
      )}
      <div className="tg-chat-canvas">
        {messages.length === 0 && (
          <div className="tg-chat-empty">
            <p>No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg, index) => {
          const own = msg.senderId === String(user.id);
          const canDelete = !msg.deleted && (own || isStaff);
          const prev = index > 0 ? messages[index - 1] : null;
          const showDivider = !prev || !sameDay(prev.createdAt, msg.createdAt);
          return (
            <div key={msg.id} className="tg-bubble-wrap">
              {showDivider && (
                <div className="tg-date-divider">
                  <span>{formatDateLabel(msg.createdAt)}</span>
                </div>
              )}
              <div className={`tg-bubble-row ${own ? 'own' : 'other'}`}>
                <div
                  className={`tg-bubble ${own ? 'own' : 'other'}${msg.deleted ? ' deleted' : ''}`}
                  onContextMenu={canDelete ? (e) => { e.preventDefault(); setConfirmMsg(msg); } : undefined}
                >
                  {canDelete && (
                    <button type="button" className="tg-bubble-del" onClick={() => setConfirmMsg(msg)} aria-label="Delete message" title="Delete">
                      <FiTrash2 />
                    </button>
                  )}
                  {!own && <span className="tg-bubble-sender">{msg.senderName}</span>}
                  {msg.deleted ? (
                    <p className="tg-bubble-deleted"><FiSlash /> {own ? 'You deleted this message' : 'This message was deleted'}</p>
                  ) : msg.type === 'voice' ? (
                    <VoiceMessage url={msg.audioUrl} duration={msg.duration} />
                  ) : (
                    <p className="tg-bubble-text">{msg.text}</p>
                  )}
                  <span className="tg-bubble-meta">
                    {formatTime(msg.createdAt)}
                    {own && <span className="tg-read-tick">✓✓</span>}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {voiceBusy && <p className="voice-status">Sending voice message...</p>}
      {voiceError && <p className="voice-error" role="alert">{voiceError}</p>}

      <div className="tg-quick-replies">
        {quickReplies.map((reply) => (
          <button
            key={reply}
            type="button"
            className="tg-quick-chip"
            onClick={() => handleQuickReply(reply)}
          >
            {reply}
          </button>
        ))}
      </div>

      <form className="tg-input-bar" onSubmit={handleSubmit}>
        <VoiceInput hidden={canSend} disabled={voiceBusy} onSend={handleVoice} onError={setVoiceError} />
        <button type="button" className="tg-attach-btn" aria-label="Attach file">
          <FiPaperclip />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          aria-label="Message"
        />
        <button
          type="submit"
          className="tg-send-btn"
          disabled={!canSend}
          aria-label="Send message"
        >
          <FiSend />
        </button>
      </form>
    {confirmMsg && (
        <div className="tg-confirm-backdrop" onClick={() => !deleting && setConfirmMsg(null)}>
          <div className="tg-confirm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h4>{confirmMsg.type === 'voice' ? 'Delete this voice message?' : 'Delete this message?'}</h4>
            <p>It will be removed for everyone in this conversation.</p>
            <div className="tg-confirm-actions">
              <button type="button" className="tg-confirm-cancel" onClick={() => setConfirmMsg(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="tg-confirm-delete" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWindow;
