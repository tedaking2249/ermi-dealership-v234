import { useEffect, useMemo, useState } from 'react';
import { FiX, FiSearch, FiMessageCircle, FiPhone, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { IoCarSportOutline } from 'react-icons/io5';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { OPT, labelOf } from '../i18n/needForm';
import NeedCarForm from '../components/need/NeedCarForm';
import './CustomerRequests.css';

const PHONE = '0974382254';
const WA = '251974382254';

const TEXT = {
  en: {
    title: 'Customer Requests',
    sub: 'Cars our customers are looking for. Have one? Contact Ermi.',
    search: 'Search by make or model',
    anyYear: 'Any year', etb: 'ETB', upTo: 'Up to', noBudget: 'Budget is open',
    haveIt: 'I have this car', call: 'Call',
    urgent: 'High demand', matters: 'Important to the buyer', note: 'Note from Ermi',
    emptyT: 'No open requests right now', emptyS: 'New requests will appear here.',
    noMatch: 'No requests match your search.',
    ctaLink: 'Looking for a car? Tell us what you need',
    err: 'Could not load requests.', retry: 'Try again', close: 'Close',
    msg: (t, id) => `Hello Ermi, I have a ${t} that matches a customer request (#${id}).`,
    spec: { year: 'Year', transmission: 'Transmission', fuel: 'Fuel', body: 'Body type', budget: 'Budget' },
  },
  am: {
    title: 'የደንበኞች ጥያቄዎች',
    sub: 'ደንበኞቻችን የሚፈልጓቸው መኪኖች። አለዎት? ኤርሚን ያግኙ።',
    search: 'በብራንድ ወይም ሞዴል ይፈልጉ',
    anyYear: 'ማንኛውም ዓመት', etb: 'ብር', upTo: 'እስከ', noBudget: 'በጀት አልተወሰነም',
    haveIt: 'ይህ መኪና አለኝ', call: 'ደውል',
    urgent: 'ከፍተኛ ፍላጎት', matters: 'ለገዢው አስፈላጊ', note: 'ከኤርሚ መልእክት',
    emptyT: 'አሁን ክፍት ጥያቄ የለም', emptyS: 'አዳዲስ ጥያቄዎች እዚህ ይታያሉ።',
    noMatch: 'ከፍለጋዎ ጋር የሚመሳሰል ጥያቄ የለም።',
    ctaLink: 'መኪና ይፈልጋሉ? የሚፈልጉትን ይንገሩን',
    err: 'ጥያቄዎችን መጫን አልተቻለም።', retry: 'እንደገና ሞክር', close: 'ዝጋ',
    msg: (t, id) => `ሰላም ኤርሚ፣ ከደንበኛ ጥያቄ (#${id}) ጋር የሚመሳሰል ${t} አለኝ።`,
    spec: { year: 'ዓመት', transmission: 'ማርሽ', fuel: 'ነዳጅ', body: 'የመኪና አይነት', budget: 'በጀት' },
  },
};

const photoUrl = (id, i) => `${api.defaults.baseURL || ''}/need-requests/public/${id}/photo/${i}`;
const titleOf = (r, L) => `${r.year ? `${r.year} ` : ''}${r.make} ${r.model}`.trim() || L.anyYear;
const fmtBudget = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M` : Number(n).toLocaleString('en-US'));
const budgetText = (r, L) => (r.budget ? `${L.upTo} ${fmtBudget(r.budget)} ${L.etb}` : L.noBudget);
const waLink = (r, L) => `https://wa.me/${WA}?text=${encodeURIComponent(L.msg(titleOf(r, L), r.id.slice(-6)))}`;

function Cover({ r }) {
  const [failed, setFailed] = useState(false);
  if (r.photoCount > 0 && !failed) {
    return <img className="cr-cover-img" src={photoUrl(r.id, 0)} alt="" loading="lazy" onError={() => setFailed(true)} />;
  }
  return <div className="cr-cover-empty"><IoCarSportOutline /></div>;
}

function DetailModal({ r, L, lg, onClose }) {
  const [i, setI] = useState(0);
  const n = r.photoCount || 0;
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const rows = [
    [L.spec.year, r.year || L.anyYear],
    [L.spec.transmission, r.transmission && labelOf(OPT.transmission, r.transmission, lg)],
    [L.spec.fuel, r.fuel && labelOf(OPT.fuel, r.fuel, lg)],
    [L.spec.body, r.body && labelOf(OPT.body, r.body, lg)],
    [L.spec.budget, budgetText(r, L)],
  ].filter(([, v]) => v);
  const matters = (r.priorities || []).map((p) => labelOf(OPT.matters, p, lg)).join(', ');

  return (
    <div className="cr-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cr-modal" role="dialog" aria-modal="true">
        <button type="button" className="cr-x" onClick={onClose} aria-label={L.close}><FiX /></button>
        <div className="cr-gallery">
          {n > 0 ? <img src={photoUrl(r.id, i)} alt="" /> : <div className="cr-cover-empty"><IoCarSportOutline /></div>}
          {n > 1 && (
            <>
              <button type="button" className="cr-nav cr-prev" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous"><FiChevronLeft /></button>
              <button type="button" className="cr-nav cr-next" onClick={() => setI((i + 1) % n)} aria-label="Next"><FiChevronRight /></button>
            </>
          )}
        </div>
        <div className="cr-modal-body">
          <h2>{titleOf(r, L)}</h2>
          {r.urgent && <span className="cr-flag cr-flag-inline">{L.urgent}</span>}
          <dl className="cr-rows">
            {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            {matters && <div><dt>{L.matters}</dt><dd>{matters}</dd></div>}
          </dl>
          {r.publicNote && <p className="cr-note">{r.publicNote}</p>}
          <div className="cr-actions">
            <a className="cr-btn cr-btn-wa" href={waLink(r, L)} target="_blank" rel="noreferrer"><FiMessageCircle /> {L.haveIt}</a>
            <a className="cr-btn" href={`tel:${PHONE}`}><FiPhone /> {L.call}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerRequests() {
  const { lang } = useLanguage();
  const lg = lang === 'am' ? 'am' : 'en';
  const L = TEXT[lg];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = () => {
    setLoading(true); setError(false);
    api.get('/need-requests/public')
      .then((res) => setRows(res.data.data || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.make} ${r.model} ${r.year || ''}`.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="cr-page">
      <header className="cr-head">
        <h1>{L.title}</h1>
        <p>{L.sub}</p>
      </header>

      {rows.length > 6 && (
        <label className="cr-search">
          <FiSearch />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={L.search} aria-label={L.search} />
        </label>
      )}

      {loading && <div className="cr-grid">{[0, 1, 2].map((k) => <div key={k} className="cr-card cr-skeleton" />)}</div>}

      {!loading && error && (
        <div className="cr-empty"><p>{L.err}</p><button type="button" className="cr-btn" onClick={load}>{L.retry}</button></div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="cr-empty"><IoCarSportOutline /><h3>{L.emptyT}</h3><p>{L.emptyS}</p></div>
      )}

      {!loading && !error && rows.length > 0 && shown.length === 0 && <div className="cr-empty"><p>{L.noMatch}</p></div>}

      {!loading && !error && shown.length > 0 && (
        <div className="cr-grid">
          {shown.map((r) => {
            const tags = [
              r.transmission && labelOf(OPT.transmission, r.transmission, lg),
              r.fuel && labelOf(OPT.fuel, r.fuel, lg),
            ].filter(Boolean).join(' · ');
            return (
              <article className="cr-card" key={r.id} onClick={() => setActive(r)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setActive(r)}>
                <div className="cr-cover">
                  <Cover r={r} />
                  {r.urgent && <span className="cr-flag">{L.urgent}</span>}
                </div>
                <div className="cr-card-body">
                  <h3>{titleOf(r, L)}</h3>
                  <p className="cr-budget">{budgetText(r, L)}</p>
                  {tags && <p className="cr-meta">{tags}</p>}
                  <a className="cr-btn cr-btn-wa" href={waLink(r, L)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                    <FiMessageCircle /> {L.haveIt}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="cr-foot">
        <button type="button" onClick={() => setFormOpen(true)}>{L.ctaLink} →</button>
      </p>

      {active && <DetailModal r={active} L={L} lg={lg} onClose={() => setActive(null)} />}
      {formOpen && <NeedCarForm onClose={() => setFormOpen(false)} />}
    </div>
  );
}