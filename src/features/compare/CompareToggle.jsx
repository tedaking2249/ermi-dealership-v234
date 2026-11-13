import { IoCheckmark, IoGitCompareOutline } from 'react-icons/io5';
import { useLanguage } from '../../context/LanguageContext';
import { useCompare, MAX_COMPARE } from './compareStore';
import { TEXT } from './compareText';
import './compare.css';

export default function CompareToggle({ vehicle }) {
  const { ids, toggle } = useCompare();
  const { lang } = useLanguage();
  const L = TEXT[lang === 'am' ? 'am' : 'en'];
  const id = String(vehicle.id);
  const on = ids.includes(id);
  const full = !on && ids.length >= MAX_COMPARE;

  const handle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(id);
  };

  return (
    <span
      role="checkbox"
      aria-checked={on}
      tabIndex={0}
      className={`cmp-toggle${on ? ' on' : ''}${full ? ' full' : ''}`}
      onClick={handle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handle(e); }}
      title={full ? L.max : L.compare}
    >
      {on ? <IoCheckmark /> : <IoGitCompareOutline />}
      <span>{on ? L.added : L.compare}</span>
    </span>
  );
}