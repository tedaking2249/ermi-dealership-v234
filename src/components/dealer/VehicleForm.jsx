import { useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import './VehicleForm.css';

const emptyForm = {
  make: '', model: '', year: '', price: '', mileage: '',
  fuelType: 'Petrol or Diesel', transmission: 'Automatic', image: '', featured: false,
};

const normalizeFuelType = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'ev' || normalized === 'electric' || normalized === 'electric vehicle') return 'EV';
  if (normalized === 'hybrid') return 'Hybrid';
  return 'Petrol or Diesel';
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function VehicleForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = initialData || emptyForm;
    return { ...base, fuelType: normalizeFuelType(base.fuelType) };
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(initialData?.image || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`"${file.name}" is not supported. Please use JPG, PNG or WebP.`);
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError(`"${file.name}" is larger than 5 MB. Please choose a smaller photo.`);
      return;
    }
    setError('');
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPreview(form.image || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    setError('');

    let imageUrl = form.image;
    if (photo) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('images', photo, photo.name);
        const { data: uploaded } = await api.post('/uploads/images', formData, { timeout: 120000 });
        imageUrl = uploaded?.images?.[0]?.url || imageUrl;
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Could not upload the photo.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSubmit({
      ...form,
      image: imageUrl,
      year: Number(form.year),
      price: Number(form.price),
      mileage: Number(form.mileage),
    });
  };

  return (
    <form className="vehicle-form" onSubmit={handleSubmit}>
      <div className="vehicle-form-grid">
        <label>
          Make
          <input name="make" value={form.make} onChange={handleChange} required />
        </label>
        <label>
          Model
          <input name="model" value={form.model} onChange={handleChange} required />
        </label>
        <label>
          Year
          <input type="number" name="year" value={form.year} onChange={handleChange} required />
        </label>
        <label>
          Price (ETB)
          <input type="number" name="price" value={form.price} onChange={handleChange} required />
        </label>
        <label>
          Mileage
          <input type="number" name="mileage" value={form.mileage} onChange={handleChange} required />
        </label>
        <label>
          Fuel Type
          <select name="fuelType" value={form.fuelType} onChange={handleChange}>
            <option value="EV">EV</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Petrol or Diesel">Petrol or Diesel</option>
          </select>
        </label>
        <label>
          Transmission
          <select name="transmission" value={form.transmission} onChange={handleChange}>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </label>
        <label className="vehicle-form-full">
          Photo
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} />
          {preview && (
            <div className="vehicle-form-photo-preview">
              <img src={preview} alt="Vehicle" />
              {photo && <button type="button" onClick={removePhoto}>Remove</button>}
            </div>
          )}
        </label>
        <label className="vehicle-form-checkbox">
          <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
          Featured on homepage
        </label>
      </div>

      {error && <p className="gmc-error" role="alert">{error}</p>}

      <div className="vehicle-form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={uploading}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={uploading}>
          {uploading ? 'Uploading photo...' : 'Save Vehicle'}
        </button>
      </div>
    </form>
  );
}

export default VehicleForm;
