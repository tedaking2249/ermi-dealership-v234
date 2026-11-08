import { Link, useNavigate } from 'react-router-dom';
import { useVehicles } from '../context/VehicleContext';
import { useLanguage } from '../context/LanguageContext';
import VehicleGrid from '../components/vehicle/VehicleGrid';
import SearchBar from '../components/common/SearchBar';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { vehicles } = useVehicles();
  const featuredVehicles = vehicles.filter((v) => v.featured);

  const handleSearchSubmit = (term) => {
    if (term.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(term.trim())}`);
    } else {
      navigate('/inventory');
    }
  };

  return (
    <div>
      <section className="hero">
        <div className="hero-content">
          <h1>
            {t('heroBefore')}
            <span className="hero-highlight">{t('heroHighlight')}</span>
            {t('heroAfter')}
          </h1>
          <p>{t('heroSub')}</p>
          <SearchBar
            onSubmit={handleSearchSubmit}
            placeholder={t('searchPlaceholder')}
          />
          <Link to="/inventory" className="btn-primary hero-browse-link">
            {t('browse')}
          </Link>
        </div>
      </section>

      <section className="featured-section">
        <div className="section-header">
          <h2>{t('featured')}</h2>
          <Link to="/inventory">{t('viewAll')} &rarr;</Link>
        </div>
        <VehicleGrid vehicles={featuredVehicles} />
      </section>
    </div>
  );
}

export default Home;