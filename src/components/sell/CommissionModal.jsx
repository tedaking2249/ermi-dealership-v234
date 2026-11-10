import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiPercent, FiEdit3, FiMinus, FiPlus } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import './CommissionModal.css';

const TEXT = {
  en: {
    title: 'How much commission are you willing to pay?',
    asking: 'Your asking price',
    etb: 'ETB',
    optPercentSub: 'of your asking price',
    optOther: 'Other',
    optOtherSub: 'Enter your own amount in ETB',
    amountLabel: 'Commission amount (ETB)',
    quick: 'Quick picks',
    approx: (p) => `≈ ${p}% of your asking price`,
    errZero: 'Enter an amount greater than 0',
    errMax: 'The commission cannot be more than the asking price',
    back: 'Back',
    submit: 'Submit for review',
    busy: 'Submitting…',
    close: 'Close',
  },
  am: {
    title: 'ምን ያህል ኮሚሽን ለመክፈል ፈቃደኛ ነዎት?',
    asking: 'የጠየቁት ዋጋ',
    etb: 'ብር',
    optPercentSub: 'ከጠየቁት ዋጋ',
    optOther: 'ሌላ',
    optOtherSub: 'የራስዎን መጠን በብር ያስገቡ',
    amountLabel: 'የኮሚሽን መጠን (ብር)',
    quick: 'ፈጣን ምርጫ',
    approx: (p) => `ከጠየቁት ዋጋ ≈ ${p}%`,
    errZero: 'ከ0 የሚበልጥ መጠን ያስገቡ',
    errMax: 'ኮሚሽኑ ከጠየቁት ዋጋ መብለጥ አይችልም',
    back: 'ተመለስ',
    submit: 'ለግምገማ አስገባ',
    busy: 'በማስገባት ላይ…',
    close: 'ዝጋ',
  },
};

const RATE = 2;
const CHIPS = [10000, 25000, 50000, 100000];
const STEP = 5000;
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

export default function CommissionModal({ price, busy, onCancel, onConfirm }) {
  const { lang } = useLanguage();
  const L = TEXT[lang === 'am' ? 'am' : 'en'];
  const [choice, setChoice] = useState('percent'); // 'percent' | 'other'
  const [raw, setRaw] = useState('');
  const [touched, setTouched] = useState(false);

  const amount = Number(raw || 0);
  const percentAmount = Math.round((price * RATE) / 100);
  const pct = price > 0 ? Math.round((amount / price) * 10000) / 100 : 0;

  let error = '';
  if (choice === 'other') {
    if (amount <= 0) error = L.errZero;
    else if (price > 0 && amount > price) error = L.errMax;
  }

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [busy, onCancel]);

  const bump = (delta) => {
    setTouched(true);
    setRaw(String(Math.min(Math.max(0, amount + delta), price || 9999999999)));
  };

  const confirm = () => {
    if (busy) return;
    if (choice === 'percent') {
      onConfirm({ type: 'percent', percent: RATE, amount: percentAmount });
      return;
    }
    setTouched(true);
    if (error) return;
    onConfirm({ type: 'fixed', percent: pct, amount });
  };

  return createPortal(
    <div className="cm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="cm-modal" role="dialog" aria-modal="true" aria-labelledby="cm-title">
        <button type="button" className="cm-close" onClick={onCancel} disabled={busy} aria-label={L.close}><FiX /></button>
        <h2 id="cm-title">{L.title}</h2>
        {price > 0 && <p className="cm-asking">{L.asking}: <strong>{fmt(price)} {L.etb}</strong></p>}

        <div className="cm-options" role="radiogroup">
          <button type="button" role="radio" aria-checked={choice === 'percent'}
            className={`cm-option ${choice === 'percent' ? 'on' : ''}`} onClick={() => setChoice('percent')}>
            <span className="cm-option-icon"><FiPercent /></span>
            <span className="cm-option-text">
              <strong>2%</strong>
              <small>{L.optPercentSub}{price > 0 ? ` · ≈ ${fmt(percentAmount)} ${L.etb}` : ''}</small>
            </span>
            <span className="cm-radio" />
          </button>
          <button type="button" role="radio" aria-checked={choice === 'other'}
            className={`cm-option ${choice === 'other' ? 'on' : ''}`} onClick={() => setChoice('other')}>
            <span className="cm-option-icon"><FiEdit3 /></span>
            <span className="cm-option-text">
              <strong>{L.optOther}</strong>
              <small>{L.optOtherSub}</small>
            </span>
            <span className="cm-radio" />
          </button>
        </div>

        {choice === 'other' && (
          <div className="cm-other">
            <label htmlFor="cm-amount">{L.amountLabel}</label>
            <div className={`cm-amount ${touched && error ? 'bad' : ''}`}>
              <button type="button" onClick={() => bump(-STEP)} aria-label="-" disabled={amount <= 0}><FiMinus /></button>
              <div className="cm-amount-field">
                <input id="cm-amount" inputMode="numeric" autoFocus placeholder="0"
                  value={raw ? fmt(raw) : ''}
                  onChange={(e) => { setTouched(true); setRaw(e.target.value.replace(/\D/g, '').slice(0, 10)); }} />
                <span>{L.etb}</span>
              </div>
              <button type="button" onClick={() => bump(STEP)} aria-label="+"><FiPlus /></button>
            </div>
            <div className="cm-quick">
              <span>{L.quick}</span>
              {CHIPS.map((c) => (
                <button type="button" key={c} className={amount === c ? 'on' : ''}
                  onClick={() => { setTouched(true); setRaw(String(c)); }}>{fmt(c)}</button>
              ))}
            </div>
            {price > 0 && amount > 0 && !error && <p className="cm-approx">{L.approx(pct)}</p>}
            {touched && error && <p className="cm-error" role="alert">{error}</p>}
          </div>
        )}

        <div className="cm-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>{L.back}</button>
          <button type="button" className="btn-primary" onClick={confirm} disabled={busy}>{busy ? L.busy : L.submit}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}