import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isValidEthiopianPhone, sanitizePhoneInput } from '../utils/phoneValidation';
import './Login.css';
import './LoginTabs.css';
import './PasswordReset.css';

const emptyForm = { name: '', email: '', password: '', phone: '' };

function Login() {
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'phone' ? sanitizePhoneInput(value) : value,
    }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegister && form.phone.trim() && !isValidEthiopianPhone(form.phone)) {
      setError(t('phone.invalid'));
      return;
    }
    setSubmitting(true);

    const result = isRegister
      ? await register(form)
      : await login(form.email, form.password);

    setSubmitting(false);

    if (result.success) {
      navigate(result.user.role === 'admin' ? '/dealer/dashboard' : '/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>{isRegister ? 'Create account' : 'Login'}</h1>
        <p className="login-subtitle">
          {isRegister
            ? 'Join Ermi Dealership to save cars, book test drives and chat with us'
            : 'Sign in to your Ermi Dealership account'}
        </p>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`login-tab ${isRegister ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Create account
          </button>
        </div>

        {error && <p className="login-error">{error}</p>}

        {isRegister && (
          <label>
            Full name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              minLength={2}
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        {isRegister && (
          <label>
            Phone (optional)
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              maxLength={10}
              inputMode="numeric"
              pattern="^(09|07)\d{8}$"
            />
          </label>
        )}

        <label>
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            minLength={isRegister ? 8 : undefined}
            required
          />
          {isRegister && <span className="login-field-hint">At least 8 characters</span>}
        </label>

        {!isRegister && (
          <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
        )}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Sign In'}
        </button>

      </form>
    </div>
  );
}

export default Login;