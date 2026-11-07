import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { isSignInWithEmailLink, signInWithEmailLink, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import api, { getErrorMessage } from '../services/api';
import { RESET_EMAIL_KEY } from './ForgotPassword';
import './Login.css';
import './LoginTabs.css';
import './PasswordReset.css';

const linkError = (err) => {
  switch (err?.code) {
    case 'auth/invalid-email':
      return 'That email address does not match this link. Enter the address the link was sent to.';
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'This link has already been used or has expired. Please request a new one.';
    case 'auth/network-request-failed':
      return 'Network problem. Please check your internet connection and try again.';
    default:
      return err?.message || 'Could not verify this link. Please request a new one.';
  }
};

function ResetPassword() {
  const [stage, setStage] = useState('checking'); // checking | invalid | needEmail | form | done
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // The email link can only be used once, so make sure we only try it once
  const started = useRef(false);

  const verifyLink = async (address) => {
    setError('');
    setBusy(true);
    try {
      await signInWithEmailLink(auth, address, window.location.href);
      setEmail(address);
      setStage('form');
    } catch (err) {
      console.error('Email link error:', err);
      setError(linkError(err));
      setStage(err?.code === 'auth/invalid-email' ? 'needEmail' : 'invalid');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setStage('invalid');
      return;
    }

    let saved = '';
    try {
      saved = localStorage.getItem(RESET_EMAIL_KEY) || '';
    } catch {
      saved = '';
    }

    if (saved) verifyLink(saved);
    else setStage('needEmail');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    verifyLink(email.trim().toLowerCase());
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      await api.post('/auth/reset-password', { idToken, password });

      await signOut(auth);
      try {
        localStorage.removeItem(RESET_EMAIL_KEY);
      } catch {
        // Nothing to clean up
      }
      setStage('done');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not reset your password. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  if (stage === 'checking') {
    return (
      <div className="login-page">
        <div className="login-form">
          <h1>Checking your link...</h1>
        </div>
      </div>
    );
  }

  if (stage === 'invalid') {
    return (
      <div className="login-page">
        <div className="login-form">
          <h1>Link not valid</h1>
          <p className="login-error">
            {error || 'This password reset link is not valid. It may be incomplete, used already, or expired.'}
          </p>
          <Link to="/forgot-password" className="btn-primary" style={{ textAlign: 'center' }}>
            Request a new link
          </Link>
          <div className="reset-links">
            <Link to="/login">Back to sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'needEmail') {
    return (
      <div className="login-page">
        <form className="login-form" onSubmit={handleEmailSubmit}>
          <h1>Confirm your email</h1>
          <p className="login-subtitle">
            Enter the email address the link was sent to, so we can confirm it is you.
          </p>
          {error && <p className="login-error">{error}</p>}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </div>
    );
  }

  if (stage === 'done') {
    return (
      <div className="login-page">
        <div className="login-form">
          <h1>Password changed</h1>
          <p className="reset-success">Your password has been reset. You can now sign in with it.</p>
          <Link to="/login" className="btn-primary" style={{ textAlign: 'center' }}>
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handlePasswordSubmit}>
        <h1>Choose a new password</h1>
        <p className="login-subtitle">For {email}</p>

        {error && <p className="login-error">{error}</p>}

        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            required
          />
          <span className="login-field-hint">At least 8 characters</span>
        </label>

        <label>
          Confirm new password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            required
          />
        </label>

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving...' : 'Save new password'}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;