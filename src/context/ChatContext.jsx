import { createContext, useContext, useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot,
  addDoc, doc, setDoc, serverTimestamp, getDocs, increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

const REQUEST_TIMEOUT_MS = 15000;
const TIMEOUT_MESSAGE =
  'Could not reach the chat service. Please check your internet connection and try again.';

// A request that never answers should fail with a clear message instead of hanging forever
const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(TIMEOUT_MESSAGE)), REQUEST_TIMEOUT_MS);
    }),
  ]);

// Newest conversation first. A conversation with a pending timestamp counts as "now".
const lastActivity = (conversation) =>
  conversation.lastMessageAt?.toMillis ? conversation.lastMessageAt.toMillis() : Date.now();

const describeError = (err) => {
  if (err?.code === 'permission-denied') {
    return 'Chat is blocked by the Firestore security rules. Please contact the site owner.';
  }
  return err?.message || 'Chat could not be loaded.';
};

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const isStaff = user?.role === 'admin';

  const [conversations, setConversations] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setChatLoading(false);
      setChatError('');
      return undefined;
    }

    setChatLoading(true);

    // No server-side sorting, so no special Firestore index is needed. We sort in the browser.
    const q = isStaff
      ? collection(db, 'conversations')
      : query(collection(db, 'conversations'), where('buyerId', '==', String(userId)));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => lastActivity(b) - lastActivity(a));
        setConversations(list);
        setChatError('');
        setChatLoading(false);
      },
      (err) => {
        console.error('Chat listener error:', err);
        setChatError(describeError(err));
        setChatLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, isStaff]);

  // vehicle = null starts a general conversation (used by the Contact page)
  const getOrCreateConversation = async (vehicle) => {
    const vehicleId = vehicle ? String(vehicle.id) : 'general';
    const vehicleName = vehicle
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      : 'General inquiry';

    // Already loaded? Open it straight away without asking the server.
    const local = conversations.find((c) => c.vehicleId === vehicleId && c.buyerId === String(userId));
    if (local) return local.id;

    try {
      const existing = await withTimeout(
        getDocs(
          query(
            collection(db, 'conversations'),
            where('buyerId', '==', String(userId)),
            where('vehicleId', '==', vehicleId)
          )
        )
      );
      if (!existing.empty) return existing.docs[0].id;

      const created = await withTimeout(
        addDoc(collection(db, 'conversations'), {
          buyerId: String(userId),
          buyerName: user.name,
          dealerName: 'Ermi Dealership',
          vehicleId,
          vehicleName,
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          unreadBuyer: 0,
          unreadDealer: 0,
        })
      );
      return created.id;
    } catch (err) {
      console.error('Could not open conversation:', err);
      throw new Error(err?.code === 'permission-denied' ? describeError(err) : err.message || TIMEOUT_MESSAGE);
    }
  };

  const sendMessage = async (conversationId, text) => {
    const clean = text.trim();
    if (!clean) return;

    try {
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId: String(userId),
        senderName: user.name,
        senderRole: user.role,
        text: clean,
        createdAt: serverTimestamp(),
      });

      // The other side gets one more unread message
      await setDoc(
        doc(db, 'conversations', conversationId),
        {
          lastMessage: clean,
          lastMessageAt: serverTimestamp(),
          lastSenderRole: user.role,
          [isStaff ? 'unreadBuyer' : 'unreadDealer']: increment(1),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Could not send message:', err);
      setChatError(describeError(err));
    }
  };

  // A voice message is uploaded first. This only saves its link and length in the chat.
  const sendVoiceMessage = async (conversationId, audioUrl, duration) => {
    if (!audioUrl) return false;

    try {
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId: String(userId),
        senderName: user.name,
        senderRole: user.role,
        type: 'voice',
        text: '',
        audioUrl,
        duration: Number(duration) || 0,
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, 'conversations', conversationId),
        {
          lastMessage: 'Voice message',
          lastMessageAt: serverTimestamp(),
          lastSenderRole: user.role,
          [isStaff ? 'unreadBuyer' : 'unreadDealer']: increment(1),
        },
        { merge: true }
      );
      return true;
    } catch (err) {
      console.error('Could not send voice message:', err);
      setChatError(describeError(err));
      return false;
    }
  };

  // Called when I open a conversation: my unread counter goes back to zero
  const markRead = async (conversationId) => {
    try {
      await setDoc(
        doc(db, 'conversations', conversationId),
        { [isStaff ? 'unreadDealer' : 'unreadBuyer']: 0 },
        { merge: true }
      );
    } catch (err) {
      console.error('Could not mark conversation as read:', err);
    }
  };

  const unreadOf = (conversation) =>
    Number(isStaff ? conversation.unreadDealer : conversation.unreadBuyer) || 0;

  const unreadCount = conversations.reduce((sum, c) => sum + unreadOf(c), 0);

  // Show the count in the browser tab title, like "(2) Ermi Dealership"
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
  }, [unreadCount]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        chatLoading,
        chatError,
        unreadCount,
        unreadOf,
        getOrCreateConversation,
        sendVoiceMessage,
        sendMessage,
        markRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}