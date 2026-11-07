import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiZap, FiDroplet, FiWind, FiCamera, FiX, FiCheckCircle, FiUser, FiPhone,
} from 'react-icons/fi';
import { useListings } from '../context/ListingContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isValidEthiopianPhone, sanitizePhoneInput } from '../utils/phoneValidation';
import {
  VEHICLE_TYPES, BODY_TYPES, TRANSMISSIONS,
  HYBRID_TYPES, FEATURE_OPTIONS, MAJOR_ISSUE_OPTIONS,
} from '../data/vehicleOptions';
import './SellCar.css';

const emptyForm = {
  vehicleType: '',
  make: '', model: '', year: '', mileage: '', price: '',
  bodyType: '', transmission: '',
  hybridType: '', petrolRange: '', combinedRange: '',
  evRange: '', chargingInfo: '', batteryCondition: '',
  features: [], majorIssues: [],
  sellerName: '', sellerPhone: '',
};

const TYPE_ICONS = {
  EV: FiZap,
  Hybrid: FiWind,
  'Petrol or Diesel': FiDroplet,
};

const MAKE_OPTIONS = {
  EV: ['BYD', 'Volkswagen', 'Changan', 'Nissan', 'Chery', 'Wuling', 'Hyundai', 'Toyota', 'Other'],
  Hybrid: ['Toyota', 'BYD', 'Hyundai', 'Suzuki', 'Jetour', 'Nissan', 'Mercedes-Benz', 'Lexus', 'Other'],
  'Petrol or Diesel': ['Toyota', 'Hyundai', 'Suzuki', 'Isuzu', 'Mitsubishi', 'Nissan', 'Peugeot', 'Lifan', 'Mercedes-Benz', 'BMW', 'Ford', 'Other'],
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function SellCar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { submitListing } = useListings();

  const [form, setForm] = useState(() => ({
    ...emptyForm,
    sellerName: user?.name || '',
    sellerPhone: user?.phone || '',
  }));
  const [photos, setPhotos] = useState([]);
  const [customMake, setCustomMake] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isEV = form.vehicleType === 'EV';
  const isHybrid = form.vehicleType === 'Hybrid';
  const showBatteryFields = isEV || isHybrid;
  const showHybridOnlyFields = isHybrid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'sellerPhone' ? sanitizePhoneInput(value) : value,
    }));
  };

  const selectVehicleType = (type) => {
    setForm((prev) => ({
      ...prev,
      vehicleType: type,
      make: '',
      hybridType: '', petrolRange: '', combinedRange: '',
      evRange: type === 'EV' || type === 'Hybrid' ? prev.evRange : '',
      chargingInfo: type === 'EV' || type === 'Hybrid' ? prev.chargingInfo : '',
      batteryCondition: type === 'EV' || type === 'Hybrid' ? prev.batteryCondition : '',
    }));
    setCustomMake('');
  };

  const toggleChip = (key, value) => {
    setForm((prev) => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';

    if (photos.length + files.length > 10) {
      setError('You can upload a maximum of 10 photos.');
      return;
    }
    const wrongType = files.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (wrongType) {
      setError(`"${wrongType.name}" is not supported. Please use JPG, PNG or WebP photos.`);
      return;
    }
    const tooBig = files.find((f) => f.size > MAX_PHOTO_BYTES);
    if (tooBig) {
      setError(`"${tooBig.name}" is larger than 5 MB. Please choose a smaller photo.`);
      return;
    }
    setError('');

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random()}`, dataUrl: reader.result, name: file.name, file },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.vehicleType) {
      setError('Please select a vehicle type to continue.');
      return;
    }
    const currentYear = new Date().getFullYear();
    const yearNum = Number(form.year);
    if (!form.year || Number.isNaN(yearNum) || yearNum < 1980 || yearNum > currentYear) {
      setError('Please select a valid manufacturing year (1980–' + currentYear + ').');
      return;
    }
    if (!isValidEthiopianPhone(form.sellerPhone)) {
      setError(t('phone.invalid'));
      return;
    }
    if (form.make === 'Other' && !customMake.trim()) {
      setError('Please enter the vehicle make.');
      return;
    }
    if (photos.length === 0) {
      setError('Please upload at least one photo of your vehicle.');
      return;
    }

    setError('');
    setSubmitting(true);
    const submissionForm = {
      ...form,
      make: form.make === 'Other' ? customMake.trim() : form.make,
    };
    const result = await submitListing(submissionForm, photos.map((p) => p.file));
    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error);
    }
  };

  if (!user) {
    return (
      <div className="sell-page">
        <div className="sell-success">
          <h1 className="sell-hero-title">
            <FiCar className="sell-hero-icon" /> Sell Your Vehicle
          </h1>
          <p>
            Please sign in or create a free account first, so we can contact you about your listing.
          </p>
          <Link to="/login" className="btn-primary">Sign in or create account</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="sell-page">
        <div className="sell-success">
          <div className="sell-success-icon"><FiCheckCircle /></div>
          <h1>Listing Submitted</h1>
          <p>
            Thanks{form.sellerName ? `, ${form.sellerName}` : ''}! Your vehicle has been sent to
            our team for review. Once approved, it will appear in our public inventory.
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sell-page">
      <div className="sell-hero">
        <h1>{t('sell.title')}</h1>
        <p>Tell us about your vehicle. Our team reviews every listing before it goes live.</p>
      </div>

      <form className="sell-form" onSubmit={handleSubmit}>
        {error && <p className="sell-error">{error}</p>}

        <section className="sell-section">
          <div className="sell-section-title">
            <span className="sell-step-badge">1</span>
            <h2>Vehicle Type</h2>
          </div>
          <div className="vehicle-type-grid">
            {VEHICLE_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type];
              return (
                <button
                  type="button"
                  key={type}
                  className={`vehicle-type-card ${form.vehicleType === type ? 'active' : ''}`}
                  onClick={() => selectVehicleType(type)}
                >
                  <span className="vehicle-type-icon"><Icon /></span>
                  {type}
                </button>
              );
            })}
          </div>
        </section>

        {form.vehicleType && (
          <>
            <section className="sell-section">
              <div className="sell-section-title">
                <span className="sell-step-badge">2</span>
                <h2>Basic Information</h2>
              </div>
              <div className="sell-grid">
                <label>
                  Make
                  <select name="make" value={form.make} onChange={handleChange} required>
                    <option value="">Select...</option>
                    {(MAKE_OPTIONS[form.vehicleType] || []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </label>
                {form.make === 'Other' && (
                  <label>
                    Custom Make
                    <input
                      type="text"
                      value={customMake}
                      onChange={(e) => setCustomMake(e.target.value)}
                      placeholder="Enter make"
                      required
                    />
                  </label>
                )}
                <label>
                  Model
                  <input name="model" value={form.model} onChange={handleChange} placeholder="e.g. Corolla" required />
                </label>
                <label>
                  Year
                  <select name="year" value={form.year} onChange={handleChange} required>
                    <option value="">Select Year</option>
                    {Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Mileage (km)
                  <input type="number" name="mileage" value={form.mileage} onChange={handleChange} placeholder="e.g. 45000" required />
                </label>
                <label>
                  Price (ETB)
                  <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="e.g. 1500000" required />
                </label>
                <label>
                  Body Type
                  <select name="bodyType" value={form.bodyType} onChange={handleChange} required>
                    <option value="">Select...</option>
                    {BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
                <label>
                  Transmission
                  <select name="transmission" value={form.transmission} onChange={handleChange} required>
                    <option value="">Select...</option>
                    {TRANSMISSIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>
            </section>

            {(showHybridOnlyFields || showBatteryFields) && (
              <section className="sell-section sell-section-accent">
                <div className="sell-section-title">
                  <span className="sell-step-badge">3</span>
                  <h2>{isEV ? 'Electric Details' : 'Hybrid Details'}</h2>
                </div>
                <div className="sell-grid">
                  {showHybridOnlyFields && (
                    <label>
                      Hybrid Type
                      <select name="hybridType" value={form.hybridType} onChange={handleChange}>
                        <option value="">Select...</option>
                        {HYBRID_TYPES.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </label>
                  )}
                  {showHybridOnlyFields && (
                    <label>
                      Petrol Range (if known)
                      <input
                        name="petrolRange"
                        value={form.petrolRange}
                        onChange={handleChange}
                        placeholder="e.g. 450 km"
                      />
                    </label>
                  )}
                  {showHybridOnlyFields && (
                    <label>
                      Combined Range (if known)
                      <input
                        name="combinedRange"
                        value={form.combinedRange}
                        onChange={handleChange}
                        placeholder="e.g. 600 km"
                      />
                    </label>
                  )}
                  {showBatteryFields && (
                    <label>
                      EV Range (km)
                      <input
                        name="evRange"
                        value={form.evRange}
                        onChange={handleChange}
                        placeholder="e.g. 300 km"
                      />
                    </label>
                  )}
                  {showBatteryFields && (
                    <label>
                      Charging Information
                      <input
                        name="chargingInfo"
                        value={form.chargingInfo}
                        onChange={handleChange}
                        placeholder="e.g. Type 2, DC fast-charge"
                      />
                    </label>
                  )}
                  {showBatteryFields && (
                    <label>
                      Battery Condition (if known)
                      <input
                        name="batteryCondition"
                        value={form.batteryCondition}
                        onChange={handleChange}
                        placeholder="e.g. 92% health"
                      />
                    </label>
                  )}
                </div>
              </section>
            )}

            <section className="sell-section">
              <div className="sell-section-title">
                <span className="sell-step-badge">4</span>
                <h2>Features</h2>
              </div>
              <div className="chip-group">
                {FEATURE_OPTIONS.map((f) => (
                  <button
                    type="button"
                    key={f}
                    className={`chip ${form.features.includes(f) ? 'active' : ''}`}
                    onClick={() => toggleChip('features', f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </section>

            <section className="sell-section">
              <div className="sell-section-title">
                <span className="sell-step-badge">5</span>
                <h2>Known Issues <span className="sell-optional">(optional)</span></h2>
              </div>
              <div className="chip-group">
                {MAJOR_ISSUE_OPTIONS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={`chip chip-warning ${form.majorIssues.includes(m) ? 'active' : ''}`}
                    onClick={() => toggleChip('majorIssues', m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </section>

            <section className="sell-section">
              <div className="sell-section-title">
                <span className="sell-step-badge">6</span>
                <h2>Photos <span className="sell-optional">({photos.length}/10)</span></h2>
              </div>
              <label className="photo-upload-box">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoUpload}
                  hidden
                />
                <span className="photo-upload-icon"><FiCamera /></span>
                <span className="photo-upload-title">Click to upload photos from your device</span>
                <span className="photo-upload-hint">Up to 10 images — JPG, PNG or WebP, max 5 MB each</span>
              </label>

              {photos.length > 0 && (
                <div className="photo-grid">
                  {photos.map((p) => (
                    <div key={p.id} className="photo-thumb">
                      <img src={p.dataUrl} alt={p.name} />
                      <button type="button" onClick={() => removePhoto(p.id)}><FiX /></button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="sell-section">
              <div className="sell-section-title">
                <span className="sell-step-badge">7</span>
                <h2>Your Contact Information</h2>
              </div>
              <div className="sell-grid">
                <label>
                  <span className="label-with-icon"><FiUser /> Your Name</span>
                  <input name="sellerName" value={form.sellerName} onChange={handleChange} placeholder="Full name" required />
                </label>
                <label>
                  <span className="label-with-icon"><FiPhone /> Phone Number</span>
                  <input type="tel" name="sellerPhone" value={form.sellerPhone} onChange={handleChange} placeholder="e.g. 0912345678" maxLength={10} inputMode="numeric" pattern="^(09|07)\d{8}$" required />
                </label>
              </div>
            </section>

            <button type="submit" className="btn-primary sell-submit" disabled={submitting}>
              {submitting ? 'Uploading photos and submitting...' : t('sell.submit')}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default SellCar;