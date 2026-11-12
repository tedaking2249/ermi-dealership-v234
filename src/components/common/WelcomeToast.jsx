import { useEffect, useState } from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { useLanguage } from '../../context/LanguageContext';
import './WelcomeToast.css';

const KEY = 'ermi_welcome';

// Shown for a few seconds right after someone signs in or creates an account.
export default function WelcomeToast() {
  const { lang } = useLanguage();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const check = () => {
      try {
        const raw = sessionStorage.getItem(KEY);
        if (!raw) return;
        sessionStorage.removeItem(KEY);
        const data = JSON.parse(raw);
        if (Date.now() - data.at < 15000) setInfo(data);
      } catch { /* ignore */ }
    };
    check();
    window.addEventListener('ermi:welcome', check);
    return () => window.removeEventListener('ermi:welcome', check);
  }, []);

  useEffect(() => {
    if (!info) return undefined;
    const id = setTimeout(() => setInfo(null), 5500);
    return () => clearTimeout(id);
  }, [info]);

  if (!info) return null;

  const first = String(info.name || '').trim().split(' ')[0];
  const am = lang === 'am';
  const reg = info.mode === 'register';
  const title = am
    ? `\u12a5\u1295\u12b3\u1295 \u12f0\u1205\u1293 \u1218\u1321\u1363 ${first}!`
    : (reg ? `Welcome, ${first}!` : `Welcome back, ${first}!`);
  const sub = am
    ? (reg ? '\u1218\u1208\u12eb\u12ce \u1270\u1348\u1325\u122f\u120d\u1363 \u1308\u1265\u1270\u12cb\u120d\u1362' : '\u1260\u1270\u1233\u12ab \u1201\u1294\u1273 \u1308\u1265\u1270\u12cb\u120d\u1362')
    : (reg ? 'Your account has been created. You are signed in.' : 'You are now signed in.');

  return (
    <div className="welcome-toast" role="status" aria-live="polite" onClick={() => setInfo(null)}>
      <IoCheckmarkCircle />
      <div>
        <strong>{title}</strong>
        <span>{sub}</span>
      </div>
    </div>
  );
}