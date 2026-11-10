import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoCallOutline, IoMailOutline, IoLocationOutline, IoTimeOutline, IoChatbubbleEllipsesOutline,
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { siteInfo } from '../../data/siteInfo';
import './SiteInfo.css';

function SiteInfo() {
  const { user } = useAuth();
  const { getOrCreateConversation } = useChat();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');

  const isStaff = user?.role === 'admin';
  const socialLinks = Object.entries(siteInfo.social).filter(([, url]) => url);

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
    <section className="site-info">
      <div className="site-info-inner">
        <div id="about" className="site-info-block">
          <h2>{t('more.about')}</h2>
          {siteInfo.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {siteInfo.highlights.length > 0 && (
            <ul className="site-info-highlights">
              {siteInfo.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div id="contact" className="site-info-block">
          <h2>{t('more.contact')}</h2>

          <ul className="site-info-contact">
            {siteInfo.phone && (
              <li>
                <IoCallOutline />
                <a href={`tel:${siteInfo.phone.replace(/\s+/g, '')}`}>{siteInfo.phone}</a>
              </li>
            )}
            {siteInfo.email && (
              <li>
                <IoMailOutline />
                <a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a>
              </li>
            )}
            {siteInfo.address && (
              <li>
                <IoLocationOutline />
                {siteInfo.mapUrl ? (
                  <a href={siteInfo.mapUrl} target="_blank" rel="noreferrer">{siteInfo.address}</a>
                ) : (
                  <span>{siteInfo.address}</span>
                )}
              </li>
            )}
            {siteInfo.hours.length > 0 && (
              <li>
                <IoTimeOutline />
                <span>
                  {siteInfo.hours.map((line) => (
                    <span key={line} className="site-info-hours-line">{line}</span>
                  ))}
                </span>
              </li>
            )}
          </ul>

          {socialLinks.length > 0 && (
            <div className="site-info-social">
              {socialLinks.map(([label, url]) => (
                <a key={label} href={url} target="_blank" rel="noreferrer">{label}</a>
              ))}
            </div>
          )}

          {error && <p className="site-info-error">{error}</p>}

          {!isStaff && (
            <button type="button" className="site-info-message" onClick={handleMessage} disabled={opening}>
              <IoChatbubbleEllipsesOutline />
              {opening ? t('contact.opening') : user ? t('contact.messageDealer') : t('contact.signInToMessage')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default SiteInfo;