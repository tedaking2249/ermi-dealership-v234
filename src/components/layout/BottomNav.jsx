import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  IoCarSportOutline, IoHeartOutline, IoChatbubbleEllipsesOutline, IoGridOutline, IoAdd,
  IoHomeOutline, IoDocumentTextOutline, IoInformationCircleOutline, IoCallOutline,
  IoLogOutOutline, IoLogInOutline, IoCloseOutline, IoSearchOutline, IoPeopleOutline,
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestContext';
import { useChat } from '../../context/ChatContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useLanguage } from '../../context/LanguageContext';
import { infoTarget } from '../../utils/infoLink';
import './BottomNav.css';

const tabClass = ({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`;

// The app-style tab bar. It only shows on phones and small tablets.
function BottomNav() {
  const { user, logout } = useAuth();
  const { unseenCount } = useRequests();
  const { unreadCount } = useChat();
  const { favoriteIds } = useFavorites();
  const { lang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname, location.hash]);

  // Staff use the dealer portal, which has its own menu
  if (user?.role === 'admin') return null;

  // Signed-out visitors who tap Saved or Messages are sent to log in first
  const gated = (path) => (user ? path : '/login');

  const handleLogout = () => {
    setMoreOpen(false);
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="bottom-nav" aria-label="Main">
        <NavLink to="/inventory" className={tabClass}>
          <span className="bottom-icon"><IoCarSportOutline /></span>
          {t('tab.inventory')}
        </NavLink>

        <NavLink to={gated('/saved')} className={tabClass}>
          <span className="bottom-icon">
            <IoHeartOutline />
            {favoriteIds.length > 0 && <span className="bottom-badge bottom-badge-soft">{favoriteIds.length}</span>}
          </span>
          {t('tab.saved')}
        </NavLink>

        <NavLink to="/sell" className="bottom-tab bottom-sell">
          <span className="bottom-sell-button"><IoAdd /></span>
          {t('tab.sell')}
        </NavLink>

        <NavLink to={gated('/chat')} className={tabClass}>
          <span className="bottom-icon">
            <IoChatbubbleEllipsesOutline />
            {unreadCount > 0 && <span className="bottom-badge">{unreadCount}</span>}
          </span>
          {t('tab.messages')}
        </NavLink>

        <button type="button" className="bottom-tab" onClick={() => setMoreOpen(true)} aria-haspopup="dialog">
          <span className="bottom-icon"><IoGridOutline /></span>
          {t('tab.more')}
        </button>
      </nav>

      {moreOpen && (
        <div className="more-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="more-sheet" role="dialog" aria-label="More" onClick={(e) => e.stopPropagation()}>
            <div className="more-header">
              <strong>{user ? user.name : t('more.welcome')}</strong>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close">
                <IoCloseOutline />
              </button>
            </div>

            <Link to="/"><IoHomeOutline /> {t('nav.home')}</Link>
            <Link to="/google-my-car"><IoSearchOutline /> {t('google.mycar')}</Link>
            <Link to="/customer-requests"><IoPeopleOutline /> {t('nav.customerRequests')}</Link>
            {user && (
              <Link to="/my-requests">
                <IoDocumentTextOutline /> {t('nav.requests')}
                {unseenCount > 0 && <span className="more-badge">{unseenCount}</span>}
              </Link>
            )}
            {user && (
              <Link to="/my-submissions">
                <IoDocumentTextOutline /> {t('my.submissions')}
              </Link>
            )}
            <Link to={infoTarget(location.pathname, '#about')}><IoInformationCircleOutline /> {t('more.about')}</Link>
            <Link to={infoTarget(location.pathname, '#contact')}><IoCallOutline /> {t('more.contact')}</Link>

            {user ? (
              <button type="button" className="more-logout" onClick={handleLogout}>
                <IoLogOutOutline /> {t('nav.logout')}
              </button>
            ) : (
              <Link to="/login"><IoLogInOutline /> {t('more.loginCreate')}</Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default BottomNav;
