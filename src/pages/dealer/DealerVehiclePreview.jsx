import { useNavigate } from 'react-router-dom';
import VehicleDetails from '../VehicleDetails';
import './DealerVehiclePreview.css';

// Shows the public car page, but inside the dealer portal so the admin never leaves it
function DealerVehiclePreview() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="dealer-preview-bar">
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          &larr; Back
        </button>
        <span>Viewing this car as buyers see it</span>
      </div>
      <VehicleDetails />
    </div>
  );
}

export default DealerVehiclePreview;