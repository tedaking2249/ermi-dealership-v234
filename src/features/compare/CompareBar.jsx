import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let timer;
    const onFull = () => { setNote(true); clearTimeout(timer); timer = setTimeout(() => setNote(false), 2500); };
    window.addEventListener('ermi:compare-full', onFull);
    return () => { window.removeEventListener('ermi:compare-full', onFull); clearTimeout(timer); };
  }, []);

  if (ids.length === 0) return null;
  const picked = ids.map((id) => vehicles.find((v) => String(v.id) === id)).filter(Boolean);

  return (
    <div className="cmp-bar" role="region" aria-label={L.title}>
      {note && <div className="cmp-bar-note">{L.max}</div>}
      <div className="cmp-bar-cars">
        {picked.map((v) => (
          <div className="cmp-chip" key={v.id}>
            {(v.image || v.photos?.[0]) && <img src={v.image || v.photos[0]} alt="" />}
            <span>{v.year} {v.make}</span>
            <button type="button" onClick={() => remove(v.id)} aria-label="Remove">&times;</button>
          </div>
        ))}
      </div>
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
  );
}