import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IoFilterOutline, IoCloseOutline } from 'react-icons/io5';
import { useVehicles } from '../context/VehicleContext';
import { useLanguage } from '../context/LanguageContext';
import VehicleGrid from '../components/vehicle/VehicleGrid';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/vehicle/FilterPanel';
import CompareBar from '../features/compare/CompareBar'; // compare-featureimport NeedCarPrompt, { NeedCarInline, NeedCarLink } from '../components/need/NeedCarPrompt';
import searchVehicles from '../utils/searchVehicles';
import filterVehicles from '../utils/filterVehicles';
import './Inventory.css';

function Inventory() {
  const { vehicles } = useVehicles();
  const { t, lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minYear: searchParams.get('minYear') || '',
    maxYear: searchParams.get('maxYear') || '',
    fuelTypes: searchParams.get('fuelTypes') ? searchParams.get('fuelTypes').split(',') : [],
    transmissions: searchParams.get('transmissions') ? searchParams.get('transmissions').split(',') : [],
  });

  const syncParams = (nextSearch, nextFilters) => {
    const params = {};
    if (nextSearch) params.search = nextSearch;
    if (nextFilters.minPrice) params.minPrice = nextFilters.minPrice;
    if (nextFilters.maxPrice) params.maxPrice = nextFilters.maxPrice;
    if (nextFilters.minYear) params.minYear = nextFilters.minYear;
    if (nextFilters.maxYear) params.maxYear = nextFilters.maxYear;
    if (nextFilters.fuelTypes?.length) params.fuelTypes = nextFilters.fuelTypes.join(',');
    if (nextFilters.transmissions?.length) params.transmissions = nextFilters.transmissions.join(',');
    setSearchParams(params);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    syncParams(term, filters);
  };

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    syncParams(searchTerm, nextFilters);
  };

  const handleClearFilters = () => {
    const cleared = {
      minPrice: '', maxPrice: '', minYear: '', maxYear: '',
      fuelTypes: [], transmissions: [],
    };
    setFilters(cleared);
    syncParams(searchTerm, cleared);
  };

  const results = useMemo(() => {
    const searched = searchVehicles(vehicles, searchTerm);
    return filterVehicles(searched, filters);
  }, [vehicles, searchTerm, filters]);

  const activeFilters = Object.values(filters).filter((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v))).length;
  const am = lang === 'am';
  const txt = {
    filters: am ? '\u121b\u1323\u122a\u12eb' : 'Filters',
    clear: am ? '\u1201\u1209\u1295\u121d \u12a0\u133d\u12f3' : 'Clear all',
    close: am ? '\u12dd\u130b' : 'Close',
    show: (n) => (am ? `${n} \u1218\u12aa\u1296\u127d\u1295 \u12a0\u1233\u12ed` : `Show ${n} cars`),
  };

  // while the phone filter panel is open: lock page scroll, Esc closes it
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setFiltersOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [filtersOpen]);

  return (
    <div className="inventory-page">
      <NeedCarPrompt />
      <div className="inventory-header">
        <h1>{t('inventory.title')}</h1>
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          onSubmit={handleSearchChange}
          placeholder={t('searchPlaceholder')}
        />
        <p className="inventory-count">
          {results.length} of {vehicles.length} {t('inventory.count')}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      <div style={{ textAlign: 'center', margin: '0 0 14px' }}><NeedCarLink /></div>

      <div className="inv-mobile-bar">
        <button type="button" className="inv-filter-btn" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog">
          <IoFilterOutline /> {txt.filters}
          {activeFilters > 0 && <span className="inv-filter-count">{activeFilters}</span>}
        </button>
        {activeFilters > 0 && (
          <button type="button" className="inv-filter-clear" onClick={handleClearFilters}>{txt.clear}</button>
        )}
        <span className="inv-mobile-count">{results.length} / {vehicles.length}</span>
      </div>

      <div className="inventory-layout">
        <div className={`inv-filters${filtersOpen ? ' open' : ''}`}>
          <div className="inv-filters-backdrop" onClick={() => setFiltersOpen(false)} />
          <div className="inv-filters-sheet" role="dialog" aria-label={txt.filters}>
            <div className="inv-filters-head">
              <strong>{txt.filters}</strong>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label={txt.close}><IoCloseOutline /></button>
            </div>
            <div className="inv-filters-body">
              <FilterPanel
                filters={filters}
                onChange={handleFiltersChange}
                onClear={handleClearFilters}
              />
            </div>
            <div className="inv-filters-foot">
              <button type="button" className="inv-foot-clear" onClick={handleClearFilters} disabled={activeFilters === 0}>{txt.clear}</button>
              <button type="button" className="inv-foot-show" onClick={() => setFiltersOpen(false)}>{txt.show(results.length)}</button>
            </div>
          </div>
        </div>
        <div className="inventory-content">
          <VehicleGrid vehicles={results} />
          {results.length === 0 && <NeedCarInline variant="empty" />}
        </div>
      </div>
    </div>
  );
}

export default Inventory;
