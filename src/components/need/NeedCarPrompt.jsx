import { useCallback, useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { NEED_TEXT } from '../../i18n/needForm';
import NeedCarForm, { DONE_KEY } from './NeedCarForm';
import './need.css';

const OPEN_EVENT = 'ermi:open-need-form';
const QUIET_DAYS = 0;

export const openNeedForm = () => window.dispatchEvent(new Event(OPEN_EVENT));

function recentlySubmitted() {
  try {
    const t = Number(localStorage.getItem(DONE_KEY) || 0);
    return t && Date.now() - t < QUIET_DAYS * 864e5;
  } catch { return false; }
}

/** Mount ONCE on the inventory page. Owns the modal and the floating nudge. */
export default function NeedCarPrompt() {
  const { lang } = useLanguage();
  const L = NEED_TEXT[lang === 'am' ? 'am' : 'en'];
  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, on);
    return () => window.removeEventListener(OPEN_EVENT, on);
  }, []);

  useEffect(() => {
    if (hidden || recentlySubmitted()) return undefined;
    let ticking = false, scrolled = false;
    const check = () => {
      ticking = false;
      const vh = window.innerHeight;
      const doc = document.documentElement.scrollHeight;
      const y = window.scrollY;
      if (y > 40) scrolled = true;
      const ratio = (y + vh) / doc;
      if (y >= vh * 1.2 && ratio < 0.85) setNudge(true);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    const timer = setTimeout(() => { if (scrolled || document.documentElement.scrollHeight <= window.innerHeight * 2) setNudge(true); }, 15000);
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timer); };
  }, [hidden]);

  const dismiss = useCallback(() => {
    setNudge(false); setHidden(true);
  }, []);

  return (
    <>
      {nudge && !hidden && !open && (
        <div className="nf-nudge" role="complementary">
          <div className="nf-nudge-icon"><FiSearch /></div>
          <div className="nf-nudge-text"><strong>{L.promptTitle}</strong><span>{L.promptSub}</span></div>
          <button type="button" className="nf-btn nf-btn-primary nf-sm" onClick={() => { setOpen(true); setNudge(false); }}>{L.promptBtn}</button>
          <button type="button" className="nf-nudge-x" onClick={dismiss} aria-label={L.dismiss}><FiX /></button>
        </div>
      )}
      {open && <NeedCarForm onClose={() => setOpen(false)} />}
    </>
  );
}

/** Inline card. variant="empty" for zero results, "grid" inside the car grid. */
export function NeedCarInline({ variant = 'grid' }) {
  const { lang } = useLanguage();
  const L = NEED_TEXT[lang === 'am' ? 'am' : 'en'];
  return (
    <div className={`nf-inline nf-inline-${variant}`}>
      <div className="nf-nudge-icon"><FiSearch /></div>
      <div className="nf-nudge-text">
        <strong>{variant === 'empty' ? L.emptyTitle : L.promptTitle}</strong>
        <span>{variant === 'empty' ? L.emptySub : L.promptSub}</span>
      </div>
      <button type="button" className="nf-btn nf-btn-primary nf-sm" onClick={openNeedForm}>{L.promptBtn}</button>
    </div>
  );
}

/** Small always-visible link (never hidden by dismiss or recent submits). */
export function NeedCarLink() {
  const { lang } = useLanguage();
  const L = NEED_TEXT[lang === 'am' ? 'am' : 'en'];
  return (
    <button type="button" onClick={openNeedForm}
      style={{ background: 'none', border: 0, color: 'var(--color-primary, #2563eb)', font: 'inherit', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
      {L.promptTitle} {L.promptBtn} →
    </button>
  );
}