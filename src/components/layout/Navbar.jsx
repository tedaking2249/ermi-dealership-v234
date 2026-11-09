import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  IoHeartOutline, IoChatbubbleEllipsesOutline, IoChevronDown,
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestContext';
import { useChat } from '../../context/ChatContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useLanguage } from '../../context/LanguageContext';
import logo from '../../assets/logo.png';
import './Navbar.css';

const navClass = ({ isActive }) => `site-nav-link ${isActive ? 'active' : ''}`;

function Navbar() {
  const { user, logout } = useAuth();
  const { unseenCount } = useRequests();
  const { unreadCount } = useChat();
  const { favoriteIds } = useFavorites();
  const { lang, toggle, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isStaff = user?.role === 'admin';
  const isBuyer = Boolean(user) && !isStaff;
  const firstName = user ? String(user.name || '').trim().split(' ')[0] : '';
  const initial = firstName.charAt(0).toUpperCase() || '?';

  // Close the account menu when the page changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // ...or when the user clicks elsewhere or presses Escape
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-logo" aria-label="Ermi Dealership home">
          <img src={logo} alt="" className="site-logo-img" />
          <span className="site-logo-text"><strong>Ermi</strong><span className="site-logo-sub"> Dealership</span></span>
        </Link>

        <nav className="site-nav" aria-label="Main">
          <NavLink to="/inventory" className={navClass}>{t('nav.inventory')}</NavLink>
          {!isStaff && <NavLink to="/sell" className={navClass}>{t('nav.sell')}</NavLink>}
          <NavLink to="/google-my-car" className={navClass}>{t('google.mycar')}</NavLink>
        </nav>

        <div className="site-spacer" />

        <div className="site-actions">
          {isBuyer && (
            <Link to="/saved" className="site-icon-btn" aria-label="Saved cars" title="Saved cars">
              <IoHeartOutline />
              {favoriteIds.length > 0 && (
                <span className="site-badge site-badge-soft">{favoriteIds.length}</span>
              )}
            </Link>
          )}

          {user && (
            <Link
              to={isStaff ? '/dealer/chat' : '/chat'}
              className="site-icon-btn"
              aria-label="Messages"
              title="Messages"
            >
              <IoChatbubbleEllipsesOutline />
              {unreadCount > 0 && <span className="site-badge">{unreadCount}</span>}
            </Link>
          )}

          <button
  type="button"
  className="site-lang-btn"
  onClick={toggle}
  aria-label="Switch language"
  title={lang === 'en' ? 'Switch to Amharic' : 'Switch to English'}
>
  {lang === 'en' ? 'EN | አማ' : 'አማ | EN'}
</button>

{user ? (
            <div className="site-account" ref={menuRef}>
              <button
                type="button"
                className="site-account-btn"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="site-avatar">{initial}</span>
                <span className="site-account-name">{firstName}</span>
                <IoChevronDown className="site-account-caret" />
              </button>

              {menuOpen && (
                <div className="site-menu" role="menu">
                  <p className="site-menu-user">{user.name}</p>

                  {isStaff && (
                    <Link to="/dealer/dashboard" role="menuitem">{t('nav.dealer')}</Link>
                  )}
                  {isBuyer && (
                    <Link to="/my-requests" role="menuitem">
                      {t('nav.requests')}
                      {unseenCount > 0 && <span className="site-badge site-badge-inline">{unseenCount}</span>}
                    </Link>
                  )}
                  {isBuyer && <Link to="/saved" role="menuitem">{t('nav.saved')}</Link>}
{isBuyer && <Link to="/my-submissions" role="menuitem">{t('my.submissions')}</Link>}

                  <button type="button" role="menuitem" className="site-menu-logout" onClick={handleLogout}>
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="site-login">{t('nav.login')}</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
