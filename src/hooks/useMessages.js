import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

function useMessages(conversationId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [conversationId]);

  return messages;
}

export default useMessages;
