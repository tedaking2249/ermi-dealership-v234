import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import ChatWindow from '../../components/chat/ChatWindow';
import './DealerChat.css';
import '../../components/chat/ChatBadges.css';

function DealerChat() {
  const { conversations, chatLoading, chatError, unreadOf, getOrCreateConversation, markRead } = useChat();
  const [activeId, setActiveId] = useState(null);
  const active = conversations.find((c) => c.id === activeId);
  const [search, setSearch] = useState('');

  const handleSelect = (conversationId) => {
    setActiveId(conversationId);
    markRead(conversationId);
  };

  const handleBack = () => {
    setActiveId(null);
  };

  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [c.buyerName, c.vehicleName, c.lastMessage]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  return (
    <div className="dealer-chat-page">
      <h1>Messages</h1>

      {chatError && <p className="chat-error-banner">{chatError}</p>}

      <div className="dealer-chat-layout">
        <div className="dealer-chat-list">
          {chatLoading && conversations.length === 0 && (
            <p className="dealer-chat-empty">Loading conversations...</p>
          )}
          {!chatLoading && conversations.length === 0 && (
            <p className="dealer-chat-empty">No conversations yet.</p>
          )}
          {conversations.map((c) => {
            const unread = unreadOf(c);
            return (
              <button
                key={c.id}
                className={`dealer-chat-item ${activeId === c.id ? 'active' : ''} ${unread > 0 ? 'chat-item-unread' : ''}`}
                onClick={() => handleSelect(c.id)}
              >
                <span className="chat-item-top">
                  <span className="dealer-chat-item-name">{c.buyerName}</span>
                  {unread > 0 && <span className="chat-unread-badge">{unread}</span>}
                </span>
                <span className="dealer-chat-item-vehicle">{c.vehicleName}</span>
                <span className="dealer-chat-item-preview">{c.lastMessage || 'No messages yet'}</span>
              </button>
            );
          })}
        </div>

        <div className="dealer-chat-window">
          {active ? (
            <ChatWindow
              conversationId={active.id}
              conversationLabel={`${active.buyerName} — ${active.vehicleName}`}
            />
          ) : (
            <p className="dealer-chat-placeholder">Select a conversation to view messages.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DealerChat;