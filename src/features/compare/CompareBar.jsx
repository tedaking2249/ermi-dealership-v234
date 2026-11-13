import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../../context/VehicleContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCompare } from './compareStore';
import { TEXT } from './compareText';
import './compare.css';

export default function CompareBar() {
  const { ids, remove, clear } = useCompare();
  const { vehicles } = useVehicles();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const L = TEXT[lang === 'am' ? 'am' : 'en'];
  const [note, setNote] = useState(false);
  const [ask, setAsk] = useState(false);
  const prevLen = useRef(ids.length);
  const lastN = useRef(ids.length);

  // second trigger: listens to the compare event directly
  useEffect(() => {
    const readN = () => {
      try { return JSON.parse(localStorage.getItem('ermi_compare') || '[]').length; } catch (e) { return 0; }
    };
    const onChange = () => setTimeout(() => {
      const n = readN();
      if (n >= 2 && n > lastN.current) setAsk(true);
      if (n < 2) setAsk(false);
      lastN.current = n;
    }, 60);
    window.addEventListener('ermi:compare', onChange);
    return () => window.removeEventListener('ermi:compare', onChange);
  }, []);

  // the prompt appears when a car is added and two or more are picked
  useEffect(() => {
    if (ids.length >= 2 && ids.length > prevLen.current) setAsk(true);
    if (ids.length < 2) setAsk(false);
    prevLen.current = ids.length;
  }, [ids.length]);

  useEffect(() => {
    if (!ask) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setAsk(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ask]);

  useEffect(() => {
    let timer;
    const onFull = () => { setNote(true); clearTimeout(timer); timer = setTimeout(() => setNote(false), 2500); };
    window.addEventListener('ermi:compare-full', onFull);
    return () => { window.removeEventListener('ermi:compare-full', onFull); clearTimeout(timer); };
  }, []);

  if (ids.length === 0) return null;
  const picked = ids.map((id) => vehicles.find((v) => String(v.id) === id)).filter(Boolean);

  const chip = (v, removable) => (
    <div className="cmp-chip" key={v.id}>
      {(v.image || v.photos?.[0]) && <img src={v.image || v.photos[0]} alt="" />}
      <span>{v.year} {v.make}</span>
      {removable && <button type="button" onClick={() => remove(v.id)} aria-label="Remove">&times;</button>}
    </div>
  );

  return (
    <>
      {ask && (
        <div className="cmp-ask-backdrop" onClick={() => setAsk(false)}>
          <div className="cmp-ask" role="dialog" aria-modal="true" aria-label={L.askTitle} onClick={(e) => e.stopPropagation()}>
            <h3>{L.askTitle}</h3>
            <p>{L.askSub}</p>
            <div className="cmp-ask-cars">{picked.map((v) => chip(v, false))}</div>
            <div className="cmp-ask-actions">
              <button type="button" className="cmp-ask-later" onClick={() => setAsk(false)}>{L.later}</button>
              <button type="button" className="cmp-go" onClick={() => { setAsk(false); navigate('/compare'); }}>{L.now}</button>
            </div>
          </div>
        </div>
      )}

      <div className="cmp-bar" role="region" aria-label={L.title}>
        {note && <div className="cmp-bar-note">{L.max}</div>}
        <div className="cmp-bar-cars">{picked.map((v) => chip(v, true))}</div>
        <div className="cmp-bar-actions">
          <button type="button" className="cmp-clear" onClick={clear}>{L.clear}</button>
          <button
            type="button"
            className="cmp-go"
            disabled={ids.length < 2}
            title={ids.length < 2 ? L.need : undefined}
            onClick={() => navigate('/compare')}
          >
            {L.compare} ({ids.length})
          </button>
        </div>
      </div>
    </>
  );
}