import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVehicles } from '../../context/VehicleContext';
import VehicleForm from '../../components/dealer/VehicleForm';
import './DealerDashboard.css';

function DealerDashboard() {
  const { user } = useAuth();
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useVehicles();

  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const handleAddClick = () => {
    setEditingVehicle(null);
    setShowForm(true);
  };

  const handleEditClick = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleMarkSold = (id) => {
    if (window.confirm('Mark this vehicle as sold?')) {
      updateVehicle(id, { status: 'SOLD' });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this vehicle from inventory?')) {
      deleteVehicle(id);
    }
  };

  const handleFormSubmit = (data) => {
    if (editingVehicle) {
      updateVehicle(editingVehicle.id, data);
    } else {
      addVehicle(data);
    }
    setShowForm(false);
    setEditingVehicle(null);
  };

  const totalVehicles = vehicles.length;
  const featuredCount = vehicles.filter((v) => v.featured).length;
  const avgPrice = totalVehicles
    ? Math.round(vehicles.reduce((sum, v) => sum + v.price, 0) / totalVehicles)
    : 0;

  return (
    <div className="dealer-dashboard">
      <div className="dealer-header">
        <div>
          <h1>Dealer Dashboard</h1>
          <p>Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className="dealer-stats">
        <div className="stat-card">
          <span className="stat-value">{totalVehicles}</span>
          <span className="stat-label">Total Vehicles</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{featuredCount}</span>
          <span className="stat-label">Featured</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">ETB {avgPrice.toLocaleString()}</span>
          <span className="stat-label">Avg. Price</span>
        </div>
      </div>

      <div className="dealer-inventory">
        <div className="dealer-inventory-header">
          <h2>Manage Inventory</h2>
          <button className="btn-primary" onClick={handleAddClick}>+ Add Vehicle</button>
        </div>

        {showForm && (
          <div className="dealer-form-panel">
            <h3>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
            <VehicleForm
              initialData={editingVehicle}
              onSubmit={handleFormSubmit}
              onCancel={() => { setShowForm(false); setEditingVehicle(null); }}
            />
          </div>
        )}

        <div className="dealer-table-wrapper">
          <table className="dealer-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Year</th>
                <th>Price</th>
                <th>Mileage</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.make} {vehicle.model}</td>
                  <td>{vehicle.year}</td>
                  <td>ETB {vehicle.price.toLocaleString()}</td>
                  <td>{vehicle.mileage.toLocaleString()} km</td>
                  <td>{vehicle.featured ? 'Yes' : 'No'}</td>
                  <td className="dealer-table-actions">
                    {vehicle.status !== 'SOLD' && (
                      <button onClick={() => handleMarkSold(vehicle.id)}>Mark as Sold</button>
                    )}
                    {vehicle.status === 'SOLD' && <span className="sold-badge">Sold</span>}
                    <button onClick={() => handleEditClick(vehicle)}>Edit</button>
                    <button className="danger" onClick={() => handleDelete(vehicle.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DealerDashboard;
