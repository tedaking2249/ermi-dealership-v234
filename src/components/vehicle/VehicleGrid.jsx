import VehicleCard from './VehicleCard';
import './VehicleGrid.css';

function VehicleGrid({ vehicles }) {
  if (!vehicles || vehicles.length === 0) {
    return <p className="vehicle-grid-empty">No vehicles found.</p>;
  }

  return (
    <div className="vehicle-grid">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}

export default VehicleGrid;
