import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { isValidEthiopianPhone, sanitizePhoneInput } from '../../utils/phoneValidation';
import './AdminUsers.css';

const ROLE_LABELS = { BUYER: 'Buyer', SALES_AGENT: 'Sales agent', ADMIN: 'Administrator' };
const PAGE_SIZE = 10;

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return `${Array.from(bytes, (b) => chars[b % chars.length]).join('')}#7`;
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const emptyForm = { name: '', email: '', phone: '', role: 'SALES_AGENT', password: '' };

function AdminUsers() {
  const { user: me } = useAuth();
  const { t } = useLanguage();
  const isAdmin = me?.apiRole === 'ADMIN';

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [credentials, setCredentials] = useState(null); // shown once after create or reset
  const [resetFor, setResetFor] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [copied, setCopied] = useState(false);

  // Wait until the admin stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/users', {
          params: {
            page,
            limit: PAGE_SIZE,
            ...(debouncedSearch && { q: debouncedSearch }),
            ...(roleFilter && { role: roleFilter }),
            ...(activeFilter && { active: activeFilter }),
          },
        });
        if (cancelled) return;
        setUsers(data.data);
        setPagination(data.pagination);
        setError('');
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load users.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, page, debouncedSearch, roleFilter, activeFilter, reloadKey]);

  if (!isAdmin) {
    return (
      <div className="users-page">
        <h1>Users</h1>
        <p className="users-error">Only administrators can manage users.</p>
      </div>
    );
  }

  const reload = () => setReloadKey((key) => key + 1);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'phone' ? sanitizePhoneInput(value) : value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (form.phone.trim() && !isValidEthiopianPhone(form.phone)) {
      setFormError(t('phone.invalid'));
      return;
    }
    setSaving(true);

    try {
      await api.post('/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        ...(form.phone.trim() && { phone: form.phone.trim() }),
      });
      setCredentials({ title: 'Account created', email: form.email.trim().toLowerCase(), password: form.password });
      setCopied(false);
      setForm(emptyForm);
      setShowCreate(false);
      setPage(1);
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not create the user.'));
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (target, changes, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusyId(target.id);
    try {
      const { data } = await api.patch(`/users/${target.id}`, changes);
      setUsers((prev) => prev.map((u) => (u.id === target.id ? data.user : u)));
    } catch (err) {
      window.alert(getErrorMessage(err, 'Could not update this user.'));
    } finally {
      setBusyId(null);
    }
  };

  const openReset = (target) => {
    setResetFor(target);
    setResetPassword(generatePassword());
    setResetError('');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setSaving(true);
    try {
      await api.patch(`/users/${resetFor.id}/password`, { password: resetPassword });
      setCredentials({ title: 'Password changed', email: resetFor.email, password: resetPassword });
      setCopied(false);
      setResetFor(null);
    } catch (err) {
      setResetError(getErrorMessage(err, 'Could not change the password.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    const ok = await copyText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
    setCopied(ok);
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>Users</h1>
          <p className="users-subtitle">{pagination.total} account(s)</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowCreate((s) => !s); setFormError(''); }}>
          {showCreate ? 'Close' : '+ Add user'}
        </button>
      </div>

      {credentials && (
        <div className="users-credentials">
          <strong>{credentials.title}. Share these details with the person:</strong>
          <p>Email: <code>{credentials.email}</code></p>
          <p>Password: <code>{credentials.password}</code></p>
          <small>This password is shown only now. It is not saved anywhere you can read it later.</small>
          <div className="users-credentials-actions">
            <button className="btn-secondary" onClick={handleCopy}>{copied ? 'Copied' : 'Copy'}</button>
            <button className="btn-secondary" onClick={() => setCredentials(null)}>Done</button>
          </div>
        </div>
      )}

      {showCreate && (
        <form className="users-form" onSubmit={handleCreate}>
          <h2>Add a user</h2>
          <div className="users-form-grid">
            <label>
              Full name
              <input name="name" value={form.name} onChange={handleFormChange} required />
            </label>
            <label>
              Email
              <input type="email" name="email" value={form.email} onChange={handleFormChange} required />
            </label>
            <label>
              Phone <span className="users-optional">(optional)</span>
              <input type="tel" name="phone" value={form.phone} onChange={handleFormChange} maxLength={10} inputMode="numeric" pattern="^(09|07)\d{8}$" />
            </label>
            <label>
              Role
              <select name="role" value={form.role} onChange={handleFormChange}>
                <option value="SALES_AGENT">Sales agent</option>
                <option value="ADMIN">Administrator</option>
                <option value="BUYER">Buyer</option>
              </select>
            </label>
            <label className="users-form-wide">
              Password (at least 8 characters)
              <div className="users-password-row">
                <input
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  minLength={8}
                  maxLength={72}
                  required
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setForm((prev) => ({ ...prev, password: generatePassword() }))}
                >
                  Generate
                </button>
              </div>
            </label>
          </div>
          {formError && <p className="users-error">{formError}</p>}
          <div className="users-form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create account'}
            </button>
          </div>
        </form>
      )}

      <div className="users-filters">
        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="BUYER">Buyers</option>
          <option value="SALES_AGENT">Sales agents</option>
          <option value="ADMIN">Administrators</option>
        </select>
        <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
          <option value="">Active and deactivated</option>
          <option value="true">Active only</option>
          <option value="false">Deactivated only</option>
        </select>
      </div>

      {error && <p className="users-error">{error}</p>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 && (
              <tr><td colSpan="7" className="users-empty">Loading users...</td></tr>
            )}
            {!loading && users.length === 0 && !error && (
              <tr><td colSpan="7" className="users-empty">No users match these filters.</td></tr>
            )}
            {users.map((u) => {
              const isMe = u.id === me.id;
              const busy = busyId === u.id;
              return (
                <tr key={u.id} className={u.isActive ? '' : 'users-row-off'}>
                  <td>{u.name}{isMe && <span className="users-you">you</span>}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '-'}</td>
                  <td>
                    <select
                      value={u.role}
                      disabled={isMe || busy}
                      onChange={(e) =>
                        updateUser(
                          u,
                          { role: e.target.value },
                          `Change ${u.name} from ${ROLE_LABELS[u.role]} to ${ROLE_LABELS[e.target.value]}?`
                        )
                      }
                    >
                      <option value="BUYER">Buyer</option>
                      <option value="SALES_AGENT">Sales agent</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </td>
                  <td>
                    <span className={`users-status ${u.isActive ? 'on' : 'off'}`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="users-actions">
                    <button disabled={busy} onClick={() => openReset(u)}>Reset password</button>
                    <button
                      className={u.isActive ? 'danger' : ''}
                      disabled={isMe || busy}
                      onClick={() =>
                        updateUser(
                          u,
                          { isActive: !u.isActive },
                          u.isActive
                            ? `Deactivate ${u.name}? They will be signed out and unable to log in.`
                            : `Activate ${u.name}?`
                        )
                      }
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="users-pager">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            className="btn-secondary"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {resetFor && (
        <div className="users-modal-backdrop" onClick={() => setResetFor(null)}>
          <form className="users-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleReset}>
            <h2>Reset password</h2>
            <p>New password for <strong>{resetFor.name}</strong> ({resetFor.email})</p>
            <div className="users-password-row">
              <input
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                required
              />
              <button type="button" className="btn-secondary" onClick={() => setResetPassword(generatePassword())}>
                Generate
              </button>
            </div>
            {resetError && <p className="users-error">{resetError}</p>}
            <div className="users-form-actions">
              <button type="button" className="btn-secondary" onClick={() => setResetFor(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;