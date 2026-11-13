import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVehicles } from '../../context/VehicleContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCompare } from './compareStore';
import { ADVICE } from './compareAdviceText';

const pick = (v, k) => v?.[k] ?? v?.specs?.[k];
const money = (n) => `${Number(n).toLocaleString()} ETB`;
const nameOf = (v) => [v.year, v.make, v.model].filter(Boolean).join(' ');
const fill = (s, n) => s.replace('{n}', n);

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

  const info = cars.map((v) => ({
    v,
    price: Number(v.price) || 0,
    year: Number(v.year) || 0,
    km: Number(v.mileage) || 0,
    auto: /auto/i.test(String(pick(v, 'transmission') || '')),
  }));

  const prices = info.map((c) => c.price).filter((n) => n > 0);
  const years = info.map((c) => c.year).filter((n) => n > 0);
  const kms = info.map((c) => c.km).filter((n) => n > 0);
  const lo = (a) => Math.min(...a);
  const hi = (a) => Math.max(...a);
  const norm = (val, a, better) => {
    if (a.length < 2 || hi(a) === lo(a)) return 0.5;
    const t = (val - lo(a)) / (hi(a) - lo(a));
    return better === 'low' ? 1 - t : t;
  };

  const scored = info.map((c) => {
    let s = 0;
    s += (c.price > 0 ? norm(c.price, prices, 'low') : 0.5) * 40;
    s += (c.year > 0 ? norm(c.year, years, 'high') : 0.5) * 30;
    s += (c.km > 0 ? norm(c.km, kms, 'low') : 0.5) * 20;
    s += c.auto ? 10 : 0;
    return { ...c, score: s };
  }).sort((a, b) => b.score - a.score);

  const facts = [];
  if (prices.length > 1 && lo(prices) !== hi(prices)) {
    const c = info.find((x) => x.price === lo(prices));
    facts.push(fill(L.sugPrice, `${nameOf(c.v)} (${money(c.price)})`));
  }
  if (years.length > 1 && lo(years) !== hi(years)) {
    const c = info.find((x) => x.year === hi(years));
    facts.push(fill(L.sugYear, nameOf(c.v)));
  }
  if (kms.length > 1 && lo(kms) !== hi(kms)) {
    const c = info.find((x) => x.km === lo(kms));
    facts.push(fill(L.sugKm, `${nameOf(c.v)} (${c.km.toLocaleString()} km)`));
  }
  const autos = info.filter((c) => c.auto);
  if (autos.length && autos.length < info.length) facts.push(fill(L.sugAuto, autos.map((c) => nameOf(c.v)).join(', ')));

  const close = cars.length > 1 && scored[0].score - scored[1].score < 3;

  return (
    <section className="cmp-advice">
      <h3>{L.priceHead}</h3>
      <div className="cmp-prices">
        {info.map((c) => (
          <div className={`cmp-price${c.price > 0 && c.price === lo(prices) && prices.length > 1 ? ' is-low' : ''}`} key={c.v.id}>
            <span>{nameOf(c.v)}</span>
            <strong>{c.price > 0 ? money(c.price) : '-'}</strong>
          </div>
        ))}
      </div>

      {cars.length > 1 && (
        <>
          <h3>{L.sugTitle}</h3>
          <p className="cmp-sug-main">{close ? L.sugTie : fill(L.sugBest, nameOf(scored[0].v))}</p>
          {facts.length > 0 && <ul className="cmp-sug-list">{facts.map((f) => <li key={f}>{f}</li>)}</ul>}
          <p className="cmp-sug-note">{L.sugNote}</p>
        </>
      )}

      <button type="button" className="cmp-done" onClick={done}>{L.done}</button>
    </section>
  );
}