import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestContext';
import { toLocalDate, fromLocalInput } from '../../utils/dateTime';
import { useLanguage } from '../../context/LanguageContext';
import { isValidEthiopianPhone, sanitizePhoneInput } from '../../utils/phoneValidation';
import './VehicleRequestForm.css';

// Dealership opening hours for test drives (24-hour clock). Change these to match yours.
const OPEN_HOUR = 8;
const CLOSE_HOUR = 18;

const pad = (n) => String(n).padStart(2, '0');

function VehicleRequestForm({ vehicle, type, onDone }) {
  const { user } = useAuth();
  const { createRequest } = useRequests();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    phone: user?.phone || '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isTestDrive = type === 'testDrive';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'phone' ? sanitizePhoneInput(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (!isValidEthiopianPhone(form.phone)) {
      setError(t('phone.invalid'));
      return;
    }

    const payload = {
      vehicleId: vehicle.id,
      type: isTestDrive ? 'TEST_DRIVE' : 'RESERVE',
      phone: form.phone.trim(),
      ...(form.notes.trim() && { message: form.notes.trim() }),
    };

    if (isTestDrive) {
      const iso = fromLocalInput(`${form.preferredDate}T${form.preferredTime}`);
      const chosen = iso ? new Date(iso) : null;

      if (!chosen) {
        setError('Please choose a date and a time.');
        return;
      }
      if (chosen.getTime() <= Date.now()) {
        setError('Please choose a date and time in the future.');
        return;
      }
      const hour = chosen.getHours() + chosen.getMinutes() / 60;
      if (hour < OPEN_HOUR || hour > CLOSE_HOUR) {
        setError(`Test drives are available between ${OPEN_HOUR}:00 and ${CLOSE_HOUR}:00.`);
        return;
      }
      payload.preferredDate = iso;
    }

    setSubmitting(true);
    const result = await createRequest(payload);
    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error);
    }
  };

  if (submitted) {
    return (
      <div className="request-form-success">
        <p>
          {isTestDrive
            ? 'Test drive request sent! You will be notified here once the dealer confirms the time.'
            : 'Reservation request sent! You will be notified here once the dealer confirms it.'}
        </p>
        <button type="button" className="btn-secondary" onClick={onDone}>Close</button>
      </div>
    );
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <h4>{isTestDrive ? 'Book a Test Drive' : 'Reserve This Vehicle'}</h4>
      <p className="request-form-subtitle">
        {isTestDrive
          ? "Choose the date and time you'd like to come in. The dealer will confirm it or suggest another time."
          : 'Send your request. The dealer will confirm your reservation and may suggest a time to visit.'}
      </p>

      <p className="request-form-car">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </p>

      <p className="request-form-who">Booking as <strong>{user?.name}</strong></p>

      <label>
        Phone Number
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="e.g. 0912345678"
          maxLength={10}
          inputMode="numeric"
          pattern="^(09|07)\d{8}$"
          required
        />
      </label>

      {isTestDrive && (
        <div className="request-form-row">
          <label>
            Preferred Date
            <input
              type="date"
              name="preferredDate"
              value={form.preferredDate}
              min={toLocalDate(new Date())}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Preferred Time
            <input
              type="time"
              name="preferredTime"
              value={form.preferredTime}
              min={`${pad(OPEN_HOUR)}:00`}
              max={`${pad(CLOSE_HOUR)}:00`}
              step="900"
              onChange={handleChange}
              required
            />
          </label>
        </div>
      )}

      <label>
        Notes <span className="request-form-optional">(optional)</span>
        <textarea
          name="notes"
          rows="3"
          value={form.notes}
          onChange={handleChange}
          placeholder={isTestDrive ? 'Anything the dealer should know?' : 'Any questions or special requests?'}
        />
      </label>

      {error && <p className="request-form-error">{error}</p>}

      <div className="request-form-actions">
        <button type="button" className="btn-secondary" onClick={onDone}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Sending...' : isTestDrive ? 'Request Test Drive' : 'Submit Reservation'}
        </button>
      </div>
    </form>
  );
}

export default VehicleRequestForm;