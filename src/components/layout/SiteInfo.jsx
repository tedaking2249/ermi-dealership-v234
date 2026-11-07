import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoCallOutline, IoMailOutline, IoLocationOutline, IoTimeOutline, IoChatbubbleEllipsesOutline,
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { siteInfo } from '../../data/siteInfo';
import './SiteInfo.css';

function SiteInfo() {
  const { user } = useAuth();
  const { getOrCreateConversation } = useChat();
  const navigate = useNavigate();
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
      setError(err.message || 'Could not open the chat. Please try again.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <section className="site-info">
      <div className="site-info-inner">
        <div id="about" className="site-info-block">
          <h2>About us</h2>
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
          <h2>Contact us</h2>

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
              {opening ? 'Opening chat...' : user ? 'Message the dealer' : 'Sign in to message us'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default SiteInfo;