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
  vin: '',
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

const OPTION_TRANSLATION_KEYS = {
  EV: 'sell.option.ev',
  Hybrid: 'sell.option.hybrid',
  'Petrol or Diesel': 'sell.option.petrolDiesel',
  Sedan: 'sell.option.sedan',
  SUV: 'sell.option.suv',
  Hatchback: 'sell.option.hatchback',
  Pickup: 'sell.option.pickup',
  Minivan: 'sell.option.minivan',
  Other: 'sell.option.other',
  Automatic: 'sell.option.automatic',
  Manual: 'sell.option.manual',
  'Semi-Automatic': 'opt.semiAutomatic',
  'Mild Hybrid': 'sell.option.mildHybrid',
  'Full Hybrid': 'sell.option.fullHybrid',
  'Plug-in Hybrid': 'sell.option.plugInHybrid',
  "Don't know": 'sell.option.dontKnow',
  'Sunroof': 'sell.option.sunroof',
  'Leather Seats': 'sell.option.leatherSeats',
  'Massage Seats': 'sell.option.massageSeats',
  Radar: 'sell.option.radar',
  '360 Camera': 'sell.option.camera360',
  'Head-up Display': 'sell.option.headUpDisplay',
  'Parking Sensors': 'sell.option.parkingSensors',
  'Reverse Camera': 'sell.option.reverseCamera',
  'None known': 'sell.option.noneKnown',
  Engine: 'sell.option.engine',
  Transmission: 'sell.option.transmission',
  Electrical: 'sell.option.electrical',
  'Body/Paint': 'sell.option.bodyPaint',
};

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

  const message = (key, values = {}) => Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    t(key),
  );

  const translateOption = (value) => {
    const key = OPTION_TRANSLATION_KEYS[value];
    return key ? t(key) : value;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'sellerPhone' ? sanitizePhoneInput(value) : name === 'vin' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : value,
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
      setError(t('sell.error.maxPhotos'));
      return;
    }
    const wrongType = files.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (wrongType) {
      setError(message('sell.error.photoType', { name: wrongType.name }));
      return;
    }
    const tooBig = files.find((f) => f.size > MAX_PHOTO_BYTES);
    if (tooBig) {
      setError(message('sell.error.photoSize', { name: tooBig.name }));
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
      setError(t('sell.error.vehicleType'));
      return;
    }
    const currentYear = new Date().getFullYear();
    const yearNum = Number(form.year);
    if (!form.year || Number.isNaN(yearNum) || yearNum < 1980 || yearNum > currentYear) {
      setError(message('sell.error.year', { min: 1980, max: currentYear }));
      return;
    }
    if (!isValidEthiopianPhone(form.sellerPhone)) {
      setError(t('phone.invalid'));
      return;
    }
    if (form.make === 'Other' && !customMake.trim()) {
      setError(t('sell.error.make'));
      return;
    }
    if (photos.length === 0) {
      setError(t('sell.error.photoRequired'));
      return;
    }

    setError('');
    setSubmitting(true);
    const submissionForm = {
      ...form,
      make: form.make === 'Other' ? customMake.trim() : form.make,
      vin: form.vin.trim() || undefined,
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
            <FiCar className="sell-hero-icon" /> {t('sell.title')}
          </h1>
          <p>{t('sell.signInPrompt')}</p>
          <Link to="/login" className="btn-primary">{t('sell.signInButton')}</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="sell-page">
        <div className="sell-success">
          <div className="sell-success-icon"><FiCheckCircle /></div>
          <h1>{t('sell.submittedTitle')}</h1>
          <p>
            {t('sell.thanks')}{form.sellerName ? `, ${form.sellerName}` : ''}! {t('sell.submittedMessage')}
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>{t('sell.backHome')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sell-page">
      <div className="sell-hero">
        <h1>{t('sell.title')}</h1>
        <p>{t('sell.intro')}</p>
      </div>

      <form className="sell-form" onSubmit={handleSubmit}>
        {error && <p className="sell-error">{error}</p>}

        <section className="sell-section">
          <div className="sell-section-title">
            <span className="sell-step-badge">1</span>
            <h2>{t('sell.vehicleType')}</h2>
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
                  {translateOption(type)}
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
                <h2>{t('sell.basicInfo')}</h2>
              </div>
              <div className="sell-grid">
                <label>
                  {t('sell.make')}
                  <select name="make" value={form.make} onChange={handleChange} required>
                    <option value="">{t('sell.select')}</option>
                    {(MAKE_OPTIONS[form.vehicleType] || []).map((m) => (
                      <option key={m} value={m}>{m === 'Other' ? translateOption(m) : m}</option>
                    ))}
                  </select>
                </label>
                {form.make === 'Other' && (
                  <label>
                    {t('sell.customMake')}
                    <input
                      type="text"
                      value={customMake}
                      onChange={(e) => setCustomMake(e.target.value)}
                      placeholder={t('sell.enterMake')}
                      required
                    />
                  </label>
                )}
                <label>
                  {t('sell.model')}
                  <input name="model" value={form.model} onChange={handleChange} placeholder={t('sell.modelPlaceholder')} required />
                </label>
                <label>
                  {t('sell.year')}
                  <select name="year" value={form.year} onChange={handleChange} required>
                    <option value="">{t('sell.selectYear')}</option>
                    {Array.from({ length: new Date().getFullYear() - 1980 + 1 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {t('sell.mileage')}
                  <input type="number" name="mileage" value={form.mileage} onChange={handleChange} placeholder={t('sell.mileagePlaceholder')} required />
                </label>
                <label>
                  {t('sell.price')}
                  <input type="number" name="price" value={form.price} onChange={handleChange} placeholder={t('sell.pricePlaceholder')} required />
                </label>
                <label>
                  {t('sell.bodyType')}
                  <select name="bodyType" value={form.bodyType} onChange={handleChange} required>
                    <option value="">{t('sell.select')}</option>
                    {BODY_TYPES.map((b) => <option key={b} value={b}>{translateOption(b)}</option>)}
                  </select>
                </label>
                <label>
                  {t('sell.transmission')}
                  <select name="transmission" value={form.transmission} onChange={handleChange} required>
                    <option value="">{t('sell.select')}</option>
                    {TRANSMISSIONS.map((value) => <option key={value} value={value}>{translateOption(value)}</option>)}
                  </select>
                </label>
                <label>
                  <span>{t('sell.vin')} <span className="sell-optional">({t('sell.optional')})</span></span>
                  <input name="vin" value={form.vin} onChange={handleChange} placeholder={t('sell.vinPlaceholder')} maxLength={17} autoComplete="off" spellCheck={false} />
                  <small>{t('sell.vinHint')}</small>
                </label>
              </div>
            </section>

            {showBatteryFields && (
              <section className="sell-section sell-section-accent">
                <div className="sell-section-title">
                  <span className="sell-step-badge">3</span>
                  <h2>{isEV ? t('sell.electricDetails') : t('sell.hybridDetails')}</h2>
                </div>
                <div className="sell-grid">
                  {showHybridOnlyFields && (
                    <label>
                      {t('sell.hybridType')}
                      <select name="hybridType" value={form.hybridType} onChange={handleChange}>
                        <option value="">{t('sell.select')}</option>
                        {HYBRID_TYPES.map((h) => <option key={h} value={h}>{translateOption(h)}</option>)}
                      </select>
                    </label>
                  )}
                  {showHybridOnlyFields && (
                    <label>
                      {t('sell.petrolRange')}
                      <input name="petrolRange" value={form.petrolRange} onChange={handleChange} placeholder={t('sell.rangePlaceholder')} />
                    </label>
                  )}
                  {showHybridOnlyFields && (
                    <label>
                      {t('sell.combinedRange')}
                      <input name="combinedRange" value={form.combinedRange} onChange={handleChange} placeholder={t('sell.rangePlaceholder')} />
                    </label>
                  )}
                  <label>
                    {t('sell.evRange')}
                    <input name="evRange" value={form.evRange} onChange={handleChange} placeholder={t('sell.rangePlaceholder')} />
                  </label>
                  <label>
                    {t('sell.chargingInfo')}
                    <input name="chargingInfo" value={form.chargingInfo} onChange={handleChange} placeholder={t('sell.chargingPlaceholder')} />
                  </label>
                  <label>
                    {t('sell.batteryCondition')}
                    <input name="batteryCondition" value={form.batteryCondition} onChange={handleChange} placeholder={t('sell.batteryPlaceholder')} />
                  </label>
                </div>
              </section>
            )}

            <section className="sell-section">
              <div className="sell-section-title">
                <span className="sell-step-badge">4</span>
                <h2>{t('sell.features')}</h2>
              </div>
              <div className="chip-group">
                {FEATURE_OPTIONS.map((f) => (
                  <button
                    type="button"
                    key={f}
                    className={`chip ${form.features.includes(f) ? 'active' : ''}`}
                    onClick={() => toggleChip('features', f)}
                  >
                    {translateOption(f)}
                  </button>
                ))}
              </div>
            </section>

            <section className="sell-section">
              <div className="sell-section-title">
                <span className="sell-step-badge">5</span>
                <h2>{t('sell.knownIssues')} <span className="sell-optional">({t('sell.optional')})</span></h2>
              </div>
              <div className="chip-group">
                {MAJOR_ISSUE_OPTIONS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={`chip chip-warning ${form.majorIssues.includes(m) ? 'active' : ''}`}
                    onClick={() => toggleChip('majorIssues', m)}
                  >
                    {translateOption(m)}
                  </button>
                ))}
              </div>
            </section>

            <section className="sell-section">
              <div className="sell-section-title">
                <span className="sell-step-badge">6</span>
                <h2>{t('sell.photos')} <span className="sell-optional">({photos.length}/10)</span></h2>
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
                <span className="photo-upload-title">{t('sell.uploadPhotos')}</span>
                <span className="photo-upload-hint">{t('sell.photoHint')}</span>
              </label>

              {photos.length > 0 && (
                <div className="photo-grid">
                  {photos.map((p) => (
                    <div key={p.id} className="photo-thumb">
                      <img src={p.dataUrl} alt={p.name} />
                      <button type="button" onClick={() => removePhoto(p.id)} aria-label={t('sell.removePhoto')}><FiX /></button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="sell-section">
              <div className="sell-section-title">
                <span className="sell-step-badge">7</span>
                <h2>{t('sell.contactInfo')}</h2>
              </div>
              <div className="sell-grid">
                <label>
                  <span className="label-with-icon"><FiUser /> {t('sell.yourName')}</span>
                  <input name="sellerName" value={form.sellerName} onChange={handleChange} placeholder={t('sell.fullName')} required />
                </label>
                <label>
                  <span className="label-with-icon"><FiPhone /> {t('sell.phoneNumber')}</span>
                  <input type="tel" name="sellerPhone" value={form.sellerPhone} onChange={handleChange} placeholder={t('sell.phonePlaceholder')} maxLength={10} inputMode="numeric" pattern="^(09|07)\d{8}$" required />
                </label>
              </div>
            </section>

            <button type="submit" className="btn-primary sell-submit" disabled={submitting}>
              {submitting ? t('sell.submitting') : t('sell.submit')}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default SellCar;
