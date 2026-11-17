import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVehicles } from '../../context/VehicleContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCompare } from './compareStore';
import { ADVICE } from './compareAdviceText';

const pick = (v, k) => v?.[k] ?? v?.specs?.[k];
const money = (n) => `${Number(n).toLocaleString()} ETB`;
const nameOf = (v) => [v.year, v.make, v.model].filter(Boolean).join(' ');
const fill = (s, n) => s.replace('{n}', n);
const clamp = (n) => Math.max(0, Math.min(1, n));

const fuelKind = (v) => {
  const f = String(pick(v, 'fuel') || pick(v, 'fuelType') || '').toLowerCase();
  if (/electric|\bev\b/.test(f)) return 'ev';
  if (/hybrid/.test(f)) return 'hybrid';
  if (/diesel/.test(f)) return 'diesel';
  if (/petrol|gasoline|benz/.test(f)) return 'petrol';
  return '';
};
const gearKind = (v) => {
  const g = String(pick(v, 'transmission') || '');
  if (/auto|cvt|dct/i.test(g)) return 'auto';
  if (/manual|stick/i.test(g)) return 'manual';
  return '';
};
const litersOf = (v) => {
  const m = String(pick(v, 'engine') || '').match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return 0;
  let n = parseFloat(m[1].replace(',', '.'));
  if (n > 50) n /= 1000;
  return n;
};
const FUEL_PTS = { ev: 15, hybrid: 13, diesel: 10, petrol: 9, '': 8 };

export default function CompareAdvice() {
  const { vehicles } = useVehicles();
  const { ids, clear } = useCompare();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const L = ADVICE[lang === 'am' ? 'am' : 'en'];

  const urlIds = (params.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const wanted = urlIds.length ? urlIds : ids;
  const cars = wanted.map((id) => vehicles.find((v) => String(v.id) === String(id))).filter(Boolean);
  if (cars.length === 0) return null;

  const done = () => { clear(); navigate('/inventory'); };
  const thisYear = new Date().getFullYear();

  const info = cars.map((v) => {
    const year = Number(v.year) || 0;
    return {
      v,
      price: Number(v.price) || 0,
      year,
      age: year ? Math.max(thisYear - year, 0) : 0,
      km: Number(v.mileage) || 0,
      fuel: fuelKind(v),
      gear: gearKind(v),
      lit: litersOf(v),
    };
  });

  const prices = info.map((c) => c.price).filter((n) => n > 0);
  const years = info.map((c) => c.year).filter((n) => n > 0);
  const kms = info.map((c) => c.km).filter((n) => n > 0);
  const lo = (a) => Math.min(...a);
  const hi = (a) => Math.max(...a);
  const rel = (val, a, better) => {
    if (a.length < 2 || hi(a) === lo(a)) return 0.5;
    const t = (val - lo(a)) / (hi(a) - lo(a));
    return better === 'low' ? 1 - t : t;
  };

  const scoreOf = (c) => {
    const priceP = (c.price > 0 ? rel(c.price, prices, 'low') : 0.5) * 20;
    const yearP = (c.year > 0 ? 0.5 * rel(c.year, years, 'high') + 0.5 * clamp(1 - c.age / 20) : 0.4) * 25;
    const kmP = (c.km > 0 ? 0.5 * rel(c.km, kms, 'low') + 0.5 * clamp(1 - c.km / 250000) : 0.4) * 20;
    const fuelP = FUEL_PTS[c.fuel];
    const gearP = c.gear === 'auto' ? 10 : c.gear === 'manual' ? 6 : 5;
    let engP = 6;
    if (c.fuel === 'ev') engP = 7;
    else if (c.lit) engP = c.lit >= 1.4 && c.lit <= 2.5 ? 10 : (c.lit >= 1 && c.lit < 1.4) || (c.lit > 2.5 && c.lit <= 3.5) ? 7 : 5;
    return priceP + yearP + kmP + fuelP + gearP + engP;
  };

  const many = info.length > 1;
  const cheapest = many && prices.length > 1 && lo(prices) !== hi(prices) ? lo(prices) : null;
  const priciest = cheapest !== null ? hi(prices) : null;
  const newest = many && years.length > 1 && lo(years) !== hi(years) ? hi(years) : null;
  const oldest = newest !== null ? lo(years) : null;

  const notesOf = (c) => {
    const good = [];
    const watch = [];
    if (c.year) {
      if (c.age <= 3) good.push(fill(L.gAlmostNew, c.age));
      else if (c.age >= 15) watch.push(fill(L.wOld, c.age));
    }
    if (c.km > 0) {
      const k = c.km.toLocaleString();
      if (c.km <= 60000) good.push(fill(L.gLowKm, k));
      else if (c.km >= 200000) watch.push(fill(L.wVeryKm, k));
      else if (c.km >= 120000) watch.push(fill(L.wHighKm, k));
    } else watch.push(L.wNoKm);
    if (c.fuel === 'ev') good.push(L.gEv);
    if (c.fuel === 'hybrid') good.push(L.gHybrid);
    if (c.fuel === 'diesel') good.push(L.gDiesel);
    if (c.gear === 'auto') good.push(L.gAuto);
    if (c.gear === 'manual') good.push(L.gManual);
    if (c.fuel !== 'ev' && c.lit) {
      if (c.lit > 3) watch.push(L.wBigEngine);
      else if (c.lit < 1) watch.push(L.wSmallEngine);
      else if (c.lit >= 1.4 && c.lit <= 2.5) good.push(L.gBalanced);
    }
    if (cheapest !== null && c.price === cheapest) good.push(L.gCheap);
    if (priciest !== null && c.price === priciest) watch.push(L.wPricey);
    if (newest !== null && c.year === newest) good.push(L.gNewest);
    if (oldest !== null && c.year === oldest) watch.push(L.wOlder);
    return { good, watch };
  };

  const ranked = info
    .map((c) => ({ ...c, score: scoreOf(c), ...notesOf(c) }))
    .sort((a, b) => b.score - a.score);
  const close = many && ranked[0].score - ranked[1].score < 3;

  return (
    <>
      <section className="cmp-advice cmp-advice-price">
        <h3>{L.priceHead}</h3>
        <div className="cmp-prices">
          {info.map((c) => (
            <div className={`cmp-price${cheapest !== null && c.price === cheapest ? ' is-low' : ''}`} key={c.v.id}>
              <span>{nameOf(c.v)}</span>
              <strong>{c.price > 0 ? money(c.price) : '-'}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="cmp-advice cmp-advice-sug">
        {many && (
          <>
            <h3>{L.sugTitle}</h3>
            <p className="cmp-sug-main">{close ? L.sugTie : fill(L.sugBest, nameOf(ranked[0].v))}</p>
            <h4 className="cmp-sug-sub">{L.sugRank}</h4>
            <ol className="cmp-rank">
              {ranked.map((c) => (
                <li key={c.v.id}><span>{nameOf(c.v)}</span><b>{fill(L.score, Math.round(c.score))}</b></li>
              ))}
            </ol>
          </>
        )}

        <div className="cmp-car-grid">
          {ranked.map((c, i) => (
            <div className={`cmp-car-card${many && i === 0 && !close ? ' is-best' : ''}`} key={c.v.id}>
              <div className="cmp-car-top">
                <strong>{nameOf(c.v)}</strong>
                {many && i === 0 && !close && <em className="cmp-badge">{L.best}</em>}
              </div>
              {c.good.length > 0 && (
                <>
                  <h4 className="cmp-sug-sub">{L.good}</h4>
                  <ul className="cmp-good">{c.good.map((g) => <li key={g}>{g}</li>)}</ul>
                </>
              )}
              {c.watch.length > 0 && (
                <>
                  <h4 className="cmp-sug-sub">{L.watch}</h4>
                  <ul className="cmp-watch">{c.watch.map((w) => <li key={w}>{w}</li>)}</ul>
                </>
              )}
            </div>
          ))}
        </div>

        <p className="cmp-sug-note">{L.sugNote}</p>
        <button type="button" className="cmp-done" onClick={done}>{L.done}</button>
      </section>
    </>
  );
}