import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useLanguage } from '../../context/LanguageContext';
import './VehicleCard.css';

function VehicleCard({ vehicle }) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const isStaff = user?.role === 'admin';
  const saved = isFavorite(vehicle.id);

  const handleHeart = async (e) => {
    // The whole card is a link, so stop the click from opening the car page
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    const result = await toggleFavorite(vehicle.id);
    if (!result.success) window.alert(result.error);
  };

  return (
    <Link to={`/inventory/${vehicle.id}`} className="vehicle-card" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <div className="vehicle-card-image">
        {vehicle.image ? (
          <img src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} />
        ) : (
          <div className="vehicle-card-nophoto">No photo</div>
        )}
        {vehicle.status === 'SOLD' && <span className="vehicle-card-sold">{t('card.sold')}</span>}

        {!isStaff && (
          <button
            type="button"
            className={`vehicle-card-heart ${saved ? 'saved' : ''}`}
            onClick={handleHeart}
            aria-label={saved ? 'Remove from saved cars' : 'Save this car'}
            title={saved ? 'Remove from saved cars' : 'Save this car'}
          >
            {saved ? <FaHeart /> : <FaRegHeart />}
          </button>
        )}
      </div>
      <div className="vehicle-card-body">
        <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
        <p className="vehicle-card-price">ETB {vehicle.price.toLocaleString()}</p>
        <div className="vehicle-card-specs">
          {Number(vehicle.mileage) > 0 && <span>{vehicle.mileage.toLocaleString()} km</span>}
          <span>&bull;</span>
          <span>{vehicle.fuelType}</span>
          <span>&bull;</span>
          <span>{vehicle.transmission}</span>
        </div>
      </div>
    </Link>
  );
}

export default VehicleCard;
