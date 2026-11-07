import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useLanguage } from '../context/LanguageContext';
import ChatWindow from '../components/chat/ChatWindow';
import './CustomerChat.css';

function initials(label) {
  const words = String(label || '?').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatConversationTime(conversation) {
  const ts = conversation.lastMessageAt;
  if (!ts?.toDate) return '';
  const date = ts.toDate();
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);
  if (date > weekAgo) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function CustomerChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { conversations, chatLoading, chatError, unreadOf } = useChat();
  const { lang } = useLanguage();
  const [search, setSearch] = useState('');

  const active = conversations.find((c) => c.id === id);

  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [c.dealerName, c.vehicleName, c.lastMessage]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  const handleSelect = (conversationId) => {
    navigate(`/chat/${conversationId}`);
  };

  const handleBack = () => {
    navigate('/chat');
  };

  return (
    <div className="tg-page customer-chat-page">
      {chatError && <p className="chat-error-banner">{chatError}</p>}

      <div className="tg-layout">
        <aside className={`tg-list-panel ${id ? 'tg-hidden-mobile' : ''}`}>
          <div className="tg-list-header">
            <h1>{lang === 'am' ? 'መልእክቶች' : 'Messages'}</h1>
            <input
              type="search"
              className="tg-search-input"
              placeholder={lang === 'am' ? 'ንግግሮችን ፈልግ' : 'Search conversations'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search conversations"
            />
          </div>

          <div className="tg-conversation-list">
            {chatLoading && conversations.length === 0 && (
              <p className="tg-empty">Loading your conversations...</p>
            )}
            {!chatLoading && conversations.length === 0 && (
              <p className="tg-empty">
                No conversations yet. Visit a vehicle page and click "Chat with Dealer" to start one.
              </p>
            )}
            {filtered.map((c) => {
              const unread = unreadOf(c);
              const label = c.dealerName || 'Ermi Dealership';
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`tg-conversation-item ${id === c.id ? 'active' : ''} ${unread > 0 ? 'unread' : ''}`}
                  onClick={() => handleSelect(c.id)}
                >
                  <div className="tg-avatar-wrap">
                    <span className="tg-avatar">{initials(label)}</span>
                    <span className="tg-online-dot" />
                  </div>
                  <div className="tg-conversation-content">
                    <div className="tg-conversation-row">
                      <span className="tg-conversation-name">{label}</span>
                      <span className="tg-conversation-time">{formatConversationTime(c)}</span>
                    </div>
                    <div className="tg-conversation-vehicle">{c.vehicleName || 'General inquiry'}</div>
                    <div className="tg-conversation-preview">{c.lastMessage || 'No messages yet'}</div>
                  </div>
                  {unread > 0 && <span className="tg-unread-badge">{unread}</span>}
                </button>
              );
            })}
          </div>
        </aside>

        <section className={`tg-chat-panel ${!id ? 'tg-hidden-mobile' : ''}`}>
          {active ? (
            <ChatWindow
              conversationId={active.id}
              conversationLabel={`${active.dealerName} — ${active.vehicleName}`}
              onBack={handleBack}
            />
          ) : (
            <div className="tg-chat-placeholder">
              {lang === 'am' ? 'ንግግር ይምረጡ' : 'Select a conversation to view messages.'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default CustomerChat;

