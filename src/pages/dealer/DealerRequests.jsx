import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRequests } from '../../context/RequestContext';
import { formatDateTime, toLocalInput, fromLocalInput, sameMoment } from '../../utils/dateTime';
import './DealerRequests.css';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'testDrives', label: 'Test Drives' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'all', label: 'All' },
];

const matchesTab = (r, tab) => {
  if (tab === 'pending') return r.status === 'PENDING';
  if (tab === 'confirmed') return r.status === 'CONFIRMED';
  if (tab === 'testDrives') return r.type === 'TEST_DRIVE';
  if (tab === 'reservations') return r.type === 'RESERVE';
  return true;
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  DECLINED: 'Declined',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled by buyer',
};

const CAR_STATUS_LABELS = { AVAILABLE: 'Available', RESERVED: 'Reserved', SOLD: 'Sold' };

function RequestCard({ request: r, onStatus }) {
  const isTest = r.type === 'TEST_DRIVE';
  const car = r.vehicle;
  // Car pages open inside the dealer portal, so the admin never lands on the public site
  const carLink = car ? `/dealer/vehicles/${car.id}` : null;

  const [mode, setMode] = useState(null); // 'confirm' | 'change' | 'decline'
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const openMode = (nextMode) => {
    setError('');
    setNote('');
    if (nextMode === 'confirm') setWhen(isTest && r.preferredDate ? toLocalInput(r.preferredDate) : '');
    if (nextMode === 'change') setWhen(r.scheduledDate ? toLocalInput(r.scheduledDate) : '');
    setMode(nextMode);
  };

  const submit = async (status) => {
    setError('');
    const payload = { status };
    if (note.trim()) payload.staffNote = note.trim();

    if (status === 'DECLINED' && note.trim().length < 3) {
      setError('Please write a short reason. The buyer will see it.');
      return;
    }

    if (status === 'CONFIRMED') {
      if ((isTest || mode === 'change') && !when) {
        setError('Pick the date and time first.');
        return;
      }
      if (when) {
        const iso = fromLocalInput(when);
        if (!iso || new Date(iso).getTime() <= Date.now()) {
          setError('Pick a date and time in the future.');
          return;
        }
        payload.scheduledDate = iso;
      }
    }

    setBusy(true);
    const result = await onStatus(r.id, payload);
    setBusy(false);

    if (result.success) setMode(null);
    else setError(result.error);
  };

  const complete = async () => {
    const message = isTest
      ? 'Mark this test drive as completed?'
      : 'Mark this car as SOLD? It will be marked sold in the inventory.';
    if (!window.confirm(message)) return;

    setBusy(true);
    const result = await onStatus(r.id, { status: 'COMPLETED' });
    setBusy(false);
    if (!result.success) window.alert(result.error);
  };

  const timeChanged =
    r.status === 'CONFIRMED' && isTest && r.scheduledDate && r.preferredDate
      && !sameMoment(r.scheduledDate, r.preferredDate);

  return (
    <div className={`request-card status-${r.status.toLowerCase()}`}>
      <div className="request-card-header">
        <span className={`request-type-badge ${isTest ? 'test-drive' : 'reservation'}`}>
          {isTest ? 'Test Drive' : 'Reservation'}
        </span>
        <span className={`request-status-badge ${r.status.toLowerCase()}`}>
          {STATUS_LABELS[r.status] || r.status}
        </span>
      </div>

      <div className="request-car">
        {car?.photos?.[0] ? (
          <Link to={carLink} title="View this car">
            <img src={car.photos[0]} alt="" className="request-car-photo" />
          </Link>
        ) : (
          <div className="request-car-photo request-car-photo-empty">No photo</div>
        )}
        <div className="request-car-info">
          <span className="request-car-label">
            {isTest ? 'Test drive for' : 'Reservation for'}
          </span>
          <h3>
            {car ? (
              <Link to={carLink}>
                {car.year} {car.make} {car.model}
              </Link>
            ) : (
              'Vehicle removed'
            )}
          </h3>
          {car && (
            <span className="request-car-meta">
              ${Number(car.price).toLocaleString()} ·{' '}
              <span className={`request-car-status ${String(car.status).toLowerCase()}`}>
                {CAR_STATUS_LABELS[car.status] || car.status}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="request-card-fields">
        <div><span>Buyer</span><strong>{r.user?.name}</strong></div>
        <div><span>Phone</span><strong>{r.phone || r.user?.phone}</strong></div>
        <div><span>Email</span><strong>{r.user?.email}</strong></div>
        {isTest && (
          <div><span>Buyer asked for</span><strong>{formatDateTime(r.preferredDate)}</strong></div>
        )}
        {r.status === 'CONFIRMED' && r.scheduledDate && (
          <div className="request-confirmed-time">
            <span>{isTest ? 'Confirmed time' : 'Visit time'}</span>
            <strong>{formatDateTime(r.scheduledDate)}</strong>
          </div>
        )}
        <div><span>Submitted</span><strong>{formatDateTime(r.createdAt)}</strong></div>
      </div>

      {timeChanged && (
        <p className="request-card-hint">You confirmed a different time than the buyer asked for.</p>
      )}
      {r.message && <p className="request-card-notes">Buyer: "{r.message}"</p>}
      {r.staffNote && <p className="request-card-staffnote">Your message: "{r.staffNote}"</p>}

      {mode && (
        <div className="request-panel">
          {(mode === 'confirm' || mode === 'change') && (
            <label>
              {isTest
                ? 'Date and time to confirm'
                : 'Visit or pick-up time (optional)'}
              <input
                type="datetime-local"
                value={when}
                min={toLocalInput(new Date())}
                onChange={(e) => setWhen(e.target.value)}
              />
              {isTest && mode === 'confirm' && (
                <small>
                  Prefilled with the time the buyer asked for. Change it if it does not suit you.
                </small>
              )}
            </label>
          )}

          <label>
            {mode === 'decline' ? 'Reason for the buyer' : 'Message to the buyer (optional)'}
            <textarea
              rows="2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                mode === 'decline'
                  ? 'e.g. Sorry, this car is no longer available.'
                  : 'e.g. Please bring your driving licence.'
              }
            />
          </label>

          {error && <p className="request-panel-error">{error}</p>}

          <div className="request-card-actions">
            <button className="btn-secondary" onClick={() => setMode(null)} disabled={busy}>
              Back
            </button>
            {mode === 'decline' ? (
              <button className="btn-reject" onClick={() => submit('DECLINED')} disabled={busy}>
                {busy ? 'Sending...' : 'Decline & notify buyer'}
              </button>
            ) : (
              <button className="btn-primary" onClick={() => submit('CONFIRMED')} disabled={busy}>
                {busy ? 'Sending...' : mode === 'change' ? 'Save new time & notify' : 'Confirm & notify buyer'}
              </button>
            )}
          </div>
        </div>
      )}

      {!mode && r.status === 'PENDING' && (
        <div className="request-card-actions">
          <button className="btn-primary" onClick={() => openMode('confirm')}>
            Confirm
          </button>
          <button className="btn-reject" onClick={() => openMode('decline')}>
            Decline
          </button>
        </div>
      )}

      {!mode && r.status === 'CONFIRMED' && (
        <div className="request-card-actions request-card-actions-wrap">
          <button className="btn-primary" onClick={complete} disabled={busy}>
            {isTest ? 'Mark completed' : 'Mark as sold'}
          </button>
          <button className="btn-secondary" onClick={() => openMode('change')}>
            Change time
          </button>
          <button className="btn-reject" onClick={() => openMode('decline')}>
            Cancel booking
          </button>
        </div>
      )}
    </div>
  );
}

function DealerRequests() {
  const { requests, loading, pendingCount, setRequestStatus } = useRequests();
  const [tab, setTab] = useState('pending');

  const filtered = requests.filter((r) => matchesTab(r, tab));

  return (
    <div className="requests-page">
      <h1>Reservations & Test Drives</h1>
      <p className="requests-subtitle">{pendingCount} pending request(s)</p>

      <div className="requests-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`requests-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {loading && requests.length === 0 && <p className="requests-empty">Loading requests...</p>}
      {!loading && filtered.length === 0 && (
        <p className="requests-empty">No requests in this view.</p>
      )}

      <div className="requests-list">
        {filtered.map((r) => (
          <RequestCard key={r.id} request={r} onStatus={setRequestStatus} />
        ))}
      </div>
    </div>
  );
}

export default DealerRequests;