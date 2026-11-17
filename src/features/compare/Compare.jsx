import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVehicles } from '../../context/VehicleContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { useCompare } from './compareStore';
import { AI_TEXT } from './compareAiText';
import './compare.css';

const pick = (v, k) => v?.[k] ?? v?.specs?.[k];
const str = (v, a, b) => String(pick(v, a) || (b ? pick(v, b) : '') || '').trim();
const nameOf = (v) => [v.year, v.make, v.model].filter(Boolean).join(' ');
const shortOf = (v) => [v.year, v.make].filter(Boolean).join(' ');
const photoOf = (v) => v.image || v.photos?.[0] || '';
const money = (n) => `${Number(n).toLocaleString()} ETB`;
const tone = (s) => (s >= 75 ? 'good' : s >= 50 ? 'mid' : 'low');

const toPayload = (v) => ({
  name: nameOf(v).slice(0, 80) || 'Car',
  price: Number(v.price) || undefined,
  year: Number(v.year) || undefined,
  mileage: Number(v.mileage) || undefined,
  fuel: str(v, 'fuel', 'fuelType').slice(0, 30) || undefined,
  transmission: str(v, 'transmission').slice(0, 30) || undefined,
  engine: str(v, 'engine').slice(0, 30) || undefined,
  body: str(v, 'body', 'bodyType').slice(0, 30) || undefined,
});

export default function Compare() {
  const { vehicles } = useVehicles();
  const { ids, clear } = useCompare();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const L = AI_TEXT[lang === 'am' ? 'am' : 'en'];
  const [tries, setTries] = useState(0);
  const [state, setState] = useState({ status: 'loading', result: null });

  const urlIds = (params.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const wanted = urlIds.length ? urlIds : ids;
  const cars = wanted.map((id) => vehicles.find((v) => String(v.id) === String(id))).filter(Boolean).slice(0, 3);
  const enough = cars.length >= 2;
  const payloadKey = JSON.stringify(cars.map(toPayload));

  const close = () => navigate('/inventory');
  const done = () => { clear(); navigate('/inventory'); };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') navigate('/inventory'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  useEffect(() => {
    if (!enough) return undefined;
    let alive = true;
    setState({ status: 'loading', result: null });
    api.post('/compare/advice', { lang: lang === 'am' ? 'am' : 'en', cars: JSON.parse(payloadKey) })
      .then((res) => {
        const r = res?.data?.result ?? res?.result;
        if (alive) setState(r ? { status: 'done', result: r } : { status: 'error', result: null });
      })
      .catch(() => { if (alive) setState({ status: 'error', result: null }); });
    return () => { alive = false; };
  }, [payloadKey, lang, tries, enough]);

  const r = state.result;
  const winner = r ? r.winner : 0;
  const closeBtn = <button type="button" className="cmp-close" onClick={close} aria-label={L.close} title={L.close}>&times;</button>;

  if (!enough) {
    return (
      <div className="cmpx">
        {closeBtn}
        <h1 className="cmpx-title">{L.title}</h1>
        {vehicles.length === 0 ? (
          <p className="cmpx-msg">{L.loading}</p>
        ) : (
          <div className="cmpx-empty">
            <p>{L.need}</p>
            <button type="button" className="cmp-done" onClick={close}>{L.browse}</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="cmpx">
      {closeBtn}
      <h1 className="cmpx-title">{L.title}</h1>

      <div className="cmpx-cars">
        {cars.map((v, i) => {
          const c = r?.cars?.[i];
          const km = Number(v.mileage) > 0 ? `${Number(v.mileage).toLocaleString()} km` : '';
          const chips = [v.year, km, str(v, 'fuel', 'fuelType'), str(v, 'transmission'), str(v, 'engine')].filter(Boolean);
          const isBest = r && winner === i + 1;
          return (
            <div className={`cmpx-car${isBest ? ' is-best' : ''}`} key={v.id}>
              {photoOf(v) && <img className="cmpx-photo" src={photoOf(v)} alt="" />}
              <div className="cmpx-body">
                <div className="cmpx-top">
                  <h2 className="cmpx-name">{[v.make, v.model].filter(Boolean).join(' ')}</h2>
                  {isBest && <em className="cmpx-badge">{L.best}</em>}
                </div>
                <p className="cmpx-price">{Number(v.price) > 0 ? money(v.price) : '-'}</p>
                <div className="cmpx-chips">{chips.map((x) => <span key={x}>{x}</span>)}</div>
                {c && (
                  <div className={`cmpx-score ${tone(c.score)}`}>
                    <div className="cmpx-scoreline"><span>{L.score}</span><b>{c.score}/100</b></div>
                    <div className="cmpx-bar"><i style={{ width: `${c.score}%` }} /></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {state.status === 'loading' && (
        <div className="cmpx-wait" role="status">
          <div className="cmpx-skel" /><div className="cmpx-skel" /><div className="cmpx-skel short" />
          <p><strong>{L.analyzing}</strong><br />{L.analyzingSub}</p>
        </div>
      )}

      {state.status === 'error' && (
        <div className="cmpx-error">
          <p>{L.err}</p>
          <button type="button" className="cmpx-retry" onClick={() => setTries((n) => n + 1)}>{L.retry}</button>
        </div>
      )}

      {r && (
        <>
          <div className="cmpx-banner">
            <span>{winner > 0 && cars[winner - 1] ? `${L.best}: ${shortOf(cars[winner - 1])}` : L.tie}</span>
            <p>{r.headline}</p>
          </div>

          <div className="cmpx-insights">
            {cars.map((v, i) => {
              const c = r.cars[i];
              if (!c) return null;
              return (
                <div className="cmpx-card" key={v.id}>
                  <h3>{shortOf(v)}</h3>
                  {c.summary && <p className="cmpx-sum">{c.summary}</p>}
                  {c.pros.length > 0 && (<><h4>{L.pros}</h4><ul className="cmpx-pros">{c.pros.map((x) => <li key={x}>{x}</li>)}</ul></>)}
                  {c.cons.length > 0 && (<><h4>{L.cons}</h4><ul className="cmpx-cons">{c.cons.map((x) => <li key={x}>{x}</li>)}</ul></>)}
                </div>
              );
            })}
          </div>

          {r.categories.length > 0 && (
            <div className="cmpx-cats">
              <h3>{L.byCat}</h3>
              {r.categories.map((c) => (
                <div className="cmpx-cat" key={c.label + c.note}>
                  <strong>{c.label}</strong>
                  <span className="cmpx-cat-note">{c.note}</span>
                  <em className={c.best > 0 ? 'win' : ''}>{c.best > 0 && cars[c.best - 1] ? shortOf(cars[c.best - 1]) : L.tieShort}</em>
                </div>
              ))}
            </div>
          )}

          {r.tip && (
            <div className="cmpx-tip"><h4>{L.tipTitle}</h4><p>{r.tip}</p></div>
          )}
          <p className="cmpx-note">{L.note}</p>
        </>
      )}

      <button type="button" className="cmp-done" onClick={done}>{L.done}</button>
    </div>
  );
}