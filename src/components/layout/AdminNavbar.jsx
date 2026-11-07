import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestContext';
import { useListings } from '../../context/ListingContext';
import { useChat } from '../../context/ChatContext';
import './AdminNavbar.css';

function AdminNavbar() {
  const { user, logout } = useAuth();
  const { pendingCount } = useRequests();
  const { pendingListings } = useListings();
  const pendingSubmissionCount = pendingListings.length;
  const { unreadCount } = useChat();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
    setActiveItem(null);
  };

  const closeMenu = () => setMenuOpen(false);

  const setActive = (itemId) => {
    setActiveItem(itemId);
  };

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-container">
        <Link to="/dealer/dashboard" className="admin-navbar-logo" onClick={closeMenu}>
          Ermi <span>Dealer Portal</span>
        </Link>

        <button
          className="admin-navbar-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <nav className={`admin-navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/dealer/dashboard" onClick={() => { setActive('dashboard'); closeMenu(); }} className={activeItem === 'dashboard' ? 'active' : ''}>Dashboard</Link>
          <Link to="/dealer/submissions" onClick={() => { setActive('submissions'); closeMenu(); }} className={activeItem === 'submissions' ? 'active' : ''}>Submissions</Link>
          <Link to="/dealer/requests" onClick={() => { setActive('requests'); closeMenu(); }} className={activeItem === 'requests' ? 'active' : ''}>Requests</Link>
          <Link to="/dealer/chat" onClick={() => { setActive('chat'); closeMenu(); }} className={activeItem === 'chat' ? 'active' : ''}>Messages</Link>
          {user?.apiRole === 'ADMIN' && (
            <Link to="/dealer/users" onClick={() => { setActive('users'); closeMenu(); }} className={activeItem === 'users' ? 'active' : ''}>Users</Link>
          )}

          <div className="admin-navbar-actions-mobile">
            <span className="admin-navbar-user">{user?.name}</span>
            <button className="btn-login" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <div className="admin-navbar-actions">
          <span className="admin-navbar-user">{user?.name}</span>
          <button className="btn-login" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;