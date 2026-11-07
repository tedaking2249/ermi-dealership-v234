import { Link, useNavigate } from 'react-router-dom';
import { useVehicles } from '../context/VehicleContext';
import VehicleGrid from '../components/vehicle/VehicleGrid';
import SearchBar from '../components/common/SearchBar';
import './Home.css';

function Home() {
  const navigate = useNavigate();
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
          <h1>Find Your <span className="hero-highlight">Perfect Vehicle</span></h1>
          <p>Quality used cars, trusted service, transparent pricing.</p>
          <SearchBar
            onSubmit={handleSearchSubmit}
            placeholder="Search by make, model, or year..."
          />
          <Link to="/inventory" className="btn-primary hero-browse-link">
            Browse Inventory
          </Link>
        </div>
      </section>

      <section className="featured-section">
        <div className="section-header">
          <h2>Featured Vehicles</h2>
          <Link to="/inventory">View All &rarr;</Link>
        </div>
        <VehicleGrid vehicles={featuredVehicles} />
      </section>
    </div>
  );
}

export default Home;
