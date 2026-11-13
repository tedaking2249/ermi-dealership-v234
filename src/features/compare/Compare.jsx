import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useVehicles } from '../../context/VehicleContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCompare, MAX_COMPARE } from './compareStore';
import { TEXT } from './compareText';
import './compare.css';

const num = (v) => Number(v) || 0;

export default function Compare() {
  const { vehicles, loading } = useVehicles();
  const { lang } = useLanguage();
  const L = TEXT[lang === 'am' ? 'am' : 'en'];
  const store = useCompare();
  const [params, setParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  const urlIds = (params.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, MAX_COMPARE);
  const fromUrl = urlIds.length > 0;
  const ids = fromUrl ? urlIds : store.ids;
  const cars = ids.map((id) => vehicles.find((v) => String(v.id) === String(id))).filter(Boolean);

  const removeCar = (id) => {
    if (fromUrl) {
      const rest = urlIds.filter((x) => x !== String(id));
      setParams(rest.length ? { ids: rest.join(',') } : {});
    } else {
      store.remove(id);
    }
  };
  const clearAll = () => { store.clear(); setParams({}); };

  const share = async () => {
    const link = `${window.location.origin}/compare?ids=${cars.map((c) => c.id).join(',')}`;
    try { await navigator.clipboard.writeText(link); } catch { window.prompt(L.copy, link); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rows = [
    { label: L.price, get: (v) => num(v.price), fmt: (n) => `ETB ${n.toLocaleString()}`, best: 'min' },
    { label: L.year, get: (v) => num(v.year), fmt: (n) => String(n), best: 'max' },
    { label: L.mileage, get: (v) => num(v.mileage), fmt: (n) => `${n.toLocaleString()} km`, best: 'min' },
    { label: L.fuel, get: (v) => v.fuelType || '' },
    { label: L.trans, get: (v) => v.transmission || '' },
    { label: L.body, get: (v) => v.bodyType || '' },
    { label: L.engine, get: (v) => v.engine || '' },
    { label: L.color, get: (v) => v.color || '' },
    { label: L.exchange, get: (v) => (v.exchangeAvailable ? (v.exchangeCar ? `${L.yes}: ${v.exchangeCar}` : L.yes) : '') },
  ];

  const prepared = rows
    .map((row) => {
      const raw = cars.map((v) => row.get(v));
      const shown = raw.map((x) => (typeof x === 'number' ? (x > 0 ? row.fmt(x) : '') : x));
      if (shown.every((s) => !s)) return null; // nobody has this value: hide the row
      let bestVal = null;
      if (row.best) {
        const nums = raw.filter((x) => typeof x === 'number' && x > 0);
        if (nums.length >= 2 && new Set(nums).size > 1) bestVal = row.best === 'min' ? Math.min(...nums) : Math.max(...nums);
      }
      return { label: row.label, shown, isBest: raw.map((x) => bestVal !== null && x === bestVal) };
    })
    .filter(Boolean);

  return (
    <div className="cmp-page">
      <div className="cmp-head">
        <h1>{L.title}</h1>
        {cars.length > 0 && (
          <div className="cmp-head-actions">
            {cars.length >= 2 && <button type="button" onClick={share}>{copied ? L.copied : L.copy}</button>}
            <button type="button" onClick={clearAll}>{L.clear}</button>
          </div>
        )}
      </div>

      {loading && cars.length === 0 ? (
        <p className="cmp-empty">{L.loading}</p>
      ) : cars.length < 2 ? (
        <div className="cmp-empty">
          <p>{L.need}</p>
          <Link to="/inventory" className="cmp-go">{L.browse}</Link>
        </div>
      ) : (
        <div className="cmp-table" style={{ '--cols': cars.length }}>
          <div className="cmp-row cmp-top">
            <div className="cmp-label" />
            {cars.map((v) => (
              <div className="cmp-cell cmp-car" key={v.id}>
                <button type="button" className="cmp-x" onClick={() => removeCar(v.id)} aria-label="Remove">&times;</button>
                <Link to={`/inventory/${v.id}`}>
                  {(v.image || v.photos?.[0]) && <img src={v.image || v.photos[0]} alt="" />}
                  <strong>{v.year} {v.make} {v.model}</strong>
                </Link>
                <Link to={`/inventory/${v.id}`} className="cmp-view">{L.view}</Link>
              </div>
            ))}
          </div>
          {prepared.map((row) => (
            <div className="cmp-row" key={row.label}>
              <div className="cmp-label">{row.label}</div>
              {row.shown.map((s, i) => (
                <div key={i} className={`cmp-cell${row.isBest[i] ? ' best' : ''}${s ? '' : ' empty'}`}>{s || '\u2014'}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}