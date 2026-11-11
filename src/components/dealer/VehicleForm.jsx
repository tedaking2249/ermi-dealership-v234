import { useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import './VehicleForm.css';

const emptyForm = {
  make: '', model: '', year: '', price: '', mileage: '',
  fuelType: 'Petrol or Diesel', transmission: 'Automatic', image: '', featured: false,
  vin: '', exchangeAvailable: false, exchangeCar: '',
};

const normalizeFuelType = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'ev' || normalized === 'electric' || normalized === 'electric vehicle') return 'EV';
  if (normalized === 'hybrid') return 'Hybrid';
  return 'Petrol or Diesel';
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 10;

function VehicleForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = initialData || emptyForm;
    return { ...base, fuelType: normalizeFuelType(base.fuelType) };
  });
  const [items, setItems] = useState(() => {
    const urls = (initialData?.photos && initialData.photos.length ? initialData.photos : [initialData?.image]).filter(Boolean);
    return urls.map((u, i) => ({ key: `u${i}`, url: u, preview: u }));
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const room = MAX_PHOTOS - items.length;
    const next = [];
    let msg = '';
    for (const file of files) {
      if (next.length >= room) { msg = `You can add up to ${MAX_PHOTOS} photos.`; break; }
      if (!ALLOWED_TYPES.includes(file.type)) { msg = `"${file.name}" is not supported. Please use JPG, PNG or WebP.`; continue; }
      if (file.size > MAX_PHOTO_BYTES) { msg = `"${file.name}" is larger than 5 MB. Please choose a smaller photo.`; continue; }
      next.push({ key: `f${Date.now()}-${next.length}-${file.name}`, file, preview: URL.createObjectURL(file) });
    }
    setError(msg);
    if (next.length) setItems((prev) => [...prev, ...next]);
  };

  const removePhoto = (i) => setItems((prev) => {
    const it = prev[i];
    if (it && it.file) URL.revokeObjectURL(it.preview);
    return prev.filter((_, idx) => idx !== i);
  });

  const makeMain = (i) => setItems((prev) => {
    const copy = [...prev];
    const [it] = copy.splice(i, 1);
    return [it, ...copy];
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    setError('');

    const finalPhotos = [];
    if (items.some((it) => it.file)) setUploading(true);
    try {
      for (const it of items) {
        if (it.file) {
          const formData = new FormData();
          formData.append('images', it.file, it.file.name);
          const { data: uploaded } = await api.post('/uploads/images', formData, { timeout: 120000 });
          const url = uploaded?.images?.[0]?.url;
          if (!url) throw new Error('A photo could not be uploaded.');
          finalPhotos.push(url);
        } else {
          finalPhotos.push(it.url);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not upload the photos.');
      setUploading(false);
      return;
    }
    setUploading(false);

    onSubmit({
      ...form,
      image: finalPhotos[0] || '',
      photos: finalPhotos,
      year: Number(form.year),
      price: Number(form.price),
      mileage: Number(form.mileage),
      vin: (form.vin || '').trim(),
      exchangeAvailable: !!form.exchangeAvailable,
      exchangeCar: form.exchangeAvailable ? (form.exchangeCar || '').trim() : '',
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
          Engine
          <input name="engine" value={form.engine || ''} onChange={handleChange} placeholder="e.g. 2.0L 4-cylinder petrol" maxLength={60} />
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
            <option value="Semi-Automatic">Semi-Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </label>
        <label>
          VIN Number (optional)
          <input
            name="vin"
            value={form.vin || ''}
            maxLength={17}
            placeholder="17 characters, optional"
            onChange={(e) => setForm((prev) => ({ ...prev, vin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
          />
        </label>
        <div className="vehicle-form-full">
          <span>Exchange possible?</span>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: 6 }}>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6, display: 'flex' }}>
              <input type="radio" name="exchangeAvailable" style={{ width: 'auto' }}
                checked={!!form.exchangeAvailable}
                onChange={() => setForm((prev) => ({ ...prev, exchangeAvailable: true }))} />
              Yes
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6, display: 'flex' }}>
              <input type="radio" name="exchangeAvailable" style={{ width: 'auto' }}
                checked={!form.exchangeAvailable}
                onChange={() => setForm((prev) => ({ ...prev, exchangeAvailable: false, exchangeCar: '' }))} />
              No
            </label>
          </div>
        </div>
        {form.exchangeAvailable && (
          <label className="vehicle-form-full">
            Car accepted for exchange
            <input name="exchangeCar" value={form.exchangeCar || ''} onChange={handleChange}
              placeholder="e.g. Toyota Vitz 2012" required />
          </label>
        )}
        <div className="vehicle-form-full vf-photos">
          <span className="vf-photos-title">Photos ({items.length}/{MAX_PHOTOS})</span>
          <div className="vf-photo-grid">
            {items.map((it, i) => (
              <div className={`vf-photo${i === 0 ? ' main' : ''}`} key={it.key}>
                <img src={it.preview} alt={`Photo ${i + 1}`} />
                {i === 0 && <span className="vf-photo-badge">Main</span>}
                <button type="button" className="vf-photo-x" onClick={() => removePhoto(i)} aria-label="Remove photo">&times;</button>
                {i > 0 && <button type="button" className="vf-photo-main" onClick={() => makeMain(i)}>Make main</button>}
              </div>
            ))}
            {items.length < MAX_PHOTOS && (
              <label className="vf-photo-add">
                <span>+</span>
                <small>Add photos</small>
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} hidden />
              </label>
            )}
          </div>
          <small>JPG, PNG or WebP, up to 5 MB each. The first photo is the main one.</small>
        </div>
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
