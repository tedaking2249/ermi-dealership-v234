import { VEHICLE_TYPES, TRANSMISSIONS } from '../../data/vehicleOptions';
import { useLanguage } from '../../context/LanguageContext';
import './FilterPanel.css';

function FilterPanel({ filters, onChange, onClear }) {
  const { t } = useLanguage();
  const toggleArrayValue = (key, value) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: updated });
  };

  const handleInputChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.minPrice || filters.maxPrice ||
    filters.minYear || filters.maxYear ||
    (filters.fuelTypes && filters.fuelTypes.length > 0) ||
    (filters.transmissions && filters.transmissions.length > 0);

  return (
    <aside className="filter-panel">
      <div className="filter-panel-header">
        <h3>{t('filters.title')}</h3>
        {hasActiveFilters && (
          <button type="button" className="filter-clear-btn" onClick={onClear}>
            {t('filters.clear')}
          </button>
        )}
      </div>

      <div className="filter-group">
        <h4>{t('filters.price')}</h4>
        <div className="filter-range">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => handleInputChange('minPrice', e.target.value)}
          />
          <span>–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => handleInputChange('maxPrice', e.target.value)}
          />
        </div>
      </div>

      <div className="filter-group">
        <h4>Year Range</h4>
        <div className="filter-range">
          <input
            type="number"
            placeholder="Min"
            value={filters.minYear || ''}
            onChange={(e) => handleInputChange('minYear', e.target.value)}
          />
          <span>–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxYear || ''}
            onChange={(e) => handleInputChange('maxYear', e.target.value)}
          />
        </div>
      </div>

      <div className="filter-group">
        <h4>Vehicle Type</h4>
        {VEHICLE_TYPES.map((option) => (
          <label key={option} className="filter-checkbox">
            <input
              type="checkbox"
              checked={(filters.fuelTypes || []).includes(option)}
              onChange={() => toggleArrayValue('fuelTypes', option)}
            />
            {option}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h4>Transmission</h4>
        {TRANSMISSIONS.map((option) => (
          <label key={option} className="filter-checkbox">
            <input
              type="checkbox"
              checked={(filters.transmissions || []).includes(option)}
              onChange={() => toggleArrayValue('transmissions', option)}
            />
            {option}
          </label>
        ))}
      </div>
    </aside>
  );
}

export default FilterPanel;
