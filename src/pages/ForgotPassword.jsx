import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import './Login.css';
import './LoginTabs.css';
import './PasswordReset.css';

export const RESET_EMAIL_KEY = 'ermi_reset_email';
const RESEND_SECONDS = 60;

const friendlyError = (err) => {
  switch (err?.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a while and try again.';
    case 'auth/network-request-failed':
      return 'Network problem. Please check your internet connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Password reset is not switched on yet. The site owner must enable "Email link" sign-in in Firebase.';
    case 'auth/unauthorized-continue-uri':
      return 'This website address is not authorised in Firebase yet. The site owner must add it under Authorized domains.';
    default:
      return err?.message || 'Could not send the email. Please try again.';
  }
};

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendLink = async (address) => {
    setError('');
    setSending(true);
    try {
      await sendSignInLinkToEmail(auth, address, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      });
      try {
        localStorage.setItem(RESET_EMAIL_KEY, address);
      } catch {
        // The link page will simply ask for the email again
      }
      setSentTo(address);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      console.error('Could not send reset email:', err);
      setError(friendlyError(err));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (address) sendLink(address);
  };

  if (sentTo) {
    return (
      <div className="login-page">
        <div className="login-form">
          <h1>Check your email</h1>
          <p className="reset-success">
            We sent a link to {sentTo}. Open it on this device to choose a new password.
          </p>
          <p className="reset-note">
            Can't see it? Look in your spam or junk folder. The link works once and the page it opens
            must be finished within 15 minutes.
          </p>

          {error && <p className="login-error">{error}</p>}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => sendLink(sentTo)}
            disabled={sending || cooldown > 0}
          >
            {sending ? 'Sending...' : cooldown > 0 ? `Send again in ${cooldown}s` : 'Send the email again'}
          </button>

          <div className="reset-links">
            <Link to="/login">Back to sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Forgot password?</h1>
        <p className="login-subtitle">
          Enter the email address of your account and we will send you a link to choose a new password.
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

        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? 'Sending...' : 'Send reset link'}
        </button>

        <div className="reset-links">
          <Link to="/login">Back to sign in</Link>
        </div>
      </form>
    </div>
  );
}

export default ForgotPassword;