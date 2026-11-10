import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestContext';
import { useListings } from '../../context/ListingContext';
import { useChat } from '../../context/ChatContext';
import logo from '../../assets/logo.png';
import api from '../../services/api';
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
  const [newNeeds, setNewNeeds] = useState(0);
  const [unseenSubs, setUnseenSubs] = useState(0);

  // submissions an admin has not opened yet (refreshes every 30s and when one is opened)
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const load = () =>
      api.get('/listings/unseen-count')
        .then((r) => { if (alive) setUnseenSubs(Number(r.data.count) || 0); })
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    window.addEventListener('ermi:submissions-changed', load);
    return () => { alive = false; clearInterval(id); window.removeEventListener('ermi:submissions-changed', load); };
  }, [user]);

  // count of car requests still marked NEW (refreshes every minute and when the list changes)
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const load = () =>
      api.get('/need-requests', { params: { status: 'NEW' } })
        .then((r) => { if (alive) setNewNeeds((r.data.data || []).length); })
        .catch(() => {});
    load();
    const id = setInterval(load, 60000);
    window.addEventListener('ermi:needs-changed', load);
    return () => { alive = false; clearInterval(id); window.removeEventListener('ermi:needs-changed', load); };
  }, [user]);

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
          <img src={logo} alt="" className="admin-navbar-logo-img" />
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
          <Link to="/dealer/submissions" onClick={() => { setActive('submissions'); closeMenu(); }} className={activeItem === 'submissions' ? 'active' : ''}>
            Submissions
            {unseenSubs > 0 && (
              <span style={{ marginInlineStart: 6, background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>{unseenSubs}</span>
            )}
          </Link>
          <Link to="/dealer/requests" onClick={() => { setActive('requests'); closeMenu(); }} className={activeItem === 'requests' ? 'active' : ''}>Requests</Link>
          <Link to="/dealer/car-requests" onClick={() => { setActive('car-requests'); closeMenu(); }} className={activeItem === 'car-requests' ? 'active' : ''}>
            Car requests
            {newNeeds > 0 && (
              <span style={{ marginInlineStart: 6, background: '#ef4444', color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>{newNeeds}</span>
            )}
          </Link>
          <Link to="/dealer/chat" onClick={() => { setActive('chat'); closeMenu(); }} className={activeItem === 'chat' ? 'active' : ''}>Messages</Link>
          {user?.apiRole === 'ADMIN' && (
            <>
              <Link to="/dealer/users" onClick={() => { setActive('users'); closeMenu(); }} className={activeItem === 'users' ? 'active' : ''}>Users</Link>
              <Link to="/dealer/analytics" onClick={() => { setActive('analytics'); closeMenu(); }} className={activeItem === 'analytics' ? 'active' : ''}>Analytics</Link>
            </>
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