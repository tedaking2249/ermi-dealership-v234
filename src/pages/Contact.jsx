import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import './ContactPage.css';

function Contact() {
  const { user } = useAuth();
  const { getOrCreateConversation } = useChat();
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');

  const isStaff = user?.role === 'admin';

  const handleMessage = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setError('');
    setOpening(true);
    try {
      const conversationId = await getOrCreateConversation(null);
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      setError(err.message || 'Could not open the chat. Please try again.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="contact-page">
      <h1>Contact Ermi Dealership</h1>
      <p className="contact-intro">
        Questions about a car, selling yours, or anything else? Send us a message and the dealership
        will reply right here on the site.
      </p>

      <div className="contact-card">
        <h2>Message the dealer</h2>
        <p>
          {user
            ? 'Start a conversation with our team. You will see a number on "Messages" when we reply.'
            : 'Please sign in first, so we know who to reply to.'}
        </p>

        {error && <p className="contact-error">{error}</p>}

        {isStaff ? (
          <Link to="/dealer/chat" className="btn-primary">Open dealer messages</Link>
        ) : (
          <button className="btn-primary" onClick={handleMessage} disabled={opening}>
            {opening ? 'Opening chat...' : user ? 'Message the dealer' : 'Sign in to message us'}
          </button>
        )}
      </div>

      <div className="contact-card">
        <h2>Looking at a specific car?</h2>
        <p>
          Open the car from our inventory and use <strong>Chat with Dealer</strong>, so we know which
          vehicle you mean.
        </p>
        <Link to="/inventory" className="btn-secondary">Browse inventory</Link>
      </div>
    </div>
  );
}

export default Contact;