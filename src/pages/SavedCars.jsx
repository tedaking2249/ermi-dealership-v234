import { Link } from 'react-router-dom';
import { useVehicles } from '../context/VehicleContext';
import { useFavorites } from '../context/FavoritesContext';
import VehicleCard from '../components/vehicle/VehicleCard';
import './SavedCars.css';

function SavedCars() {
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { favoriteIds, loading: favoritesLoading } = useFavorites();

  const saved = vehicles.filter((v) => favoriteIds.includes(v.id));
  const unavailable = favoriteIds.length - saved.length;
  const stillLoading = (vehiclesLoading || favoritesLoading) && saved.length === 0;

  return (
    <div className="saved-page">
      <h1>Saved Cars</h1>
      <p className="saved-subtitle">Cars you tapped the heart on, all in one place.</p>

      {stillLoading && <p className="saved-empty">Loading your saved cars...</p>}

      {!stillLoading && favoriteIds.length === 0 && (
        <div className="saved-empty">
          <p>You have not saved any cars yet. Tap the heart on a car to keep it here.</p>
          <Link to="/inventory" className="btn-primary">Browse inventory</Link>
        </div>
      )}

      {saved.length > 0 && (
        <div className="saved-grid">
          {saved.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}

      {!stillLoading && unavailable > 0 && saved.length > 0 && (
        <p className="saved-note">
          {unavailable} of your saved cars {unavailable === 1 ? 'is' : 'are'} no longer listed (sold or removed).
        </p>
      )}

      {!stillLoading && unavailable > 0 && saved.length === 0 && favoriteIds.length > 0 && (
        <p className="saved-empty">
          Your saved cars are no longer listed (sold or removed).{' '}
          <Link to="/inventory">Browse inventory</Link>
        </p>
      )}
    </div>
  );
}

export default SavedCars;