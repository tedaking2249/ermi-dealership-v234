import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useLanguage } from '../context/LanguageContext';
import './ContactPage.css';

function Contact() {
  const { user } = useAuth();
  const { getOrCreateConversation } = useChat();
  const navigate = useNavigate();
  const { t } = useLanguage();
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
      setError(err.message || t('contact.error'));
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="contact-page">
      <h1>{t('contact.title')}</h1>
      <p className="contact-intro">{t('contact.intro')}</p>

      <div className="contact-card">
        <h2>{t('contact.messageDealer')}</h2>
        <p>
          {user ? t('contact.startConv') : t('contact.signInFirst')}
        </p>

        {error && <p className="contact-error">{error}</p>}

        {isStaff ? (
          <Link to="/dealer/chat" className="btn-primary">{t('contact.openDealerMessages')}</Link>
        ) : (
          <button className="btn-primary" onClick={handleMessage} disabled={opening}>
            {opening ? t('contact.opening') : user ? t('contact.messageDealer') : t('contact.signInToMessage')}
          </button>
        )}
      </div>

      <div className="contact-card">
        <h2>{t('contact.specificTitle')}</h2>
        <p>
          {t('contact.specific1')} <strong>{t('chat.with.dealer')}</strong> {t('contact.specific2')}
        </p>
        <Link to="/inventory" className="btn-secondary">{t('contact.browse')}</Link>
      </div>
    </div>
  );
}

export default Contact;