import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRequests } from '../context/RequestContext';
import { formatDateTime, toLocalInput, fromLocalInput, sameMoment } from '../utils/dateTime';
import './MyRequests.css';

const STATUS_LABELS = {
  PENDING: 'Waiting for the dealership',
  CONFIRMED: 'Confirmed',
  DECLINED: 'Declined',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function MyRequestCard({ request: r, isNew, onCancel, onReschedule }) {
  const isTest = r.type === 'TEST_DRIVE';
  const car = r.vehicle;

  const [rescheduling, setRescheduling] = useState(false);
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canCancel = r.status === 'PENDING';
  const canReschedule = isTest && (r.status === 'PENDING' || r.status === 'CONFIRMED');
  const timeChanged =
    r.status === 'CONFIRMED' && isTest && r.scheduledDate && r.preferredDate
      && !sameMoment(r.scheduledDate, r.preferredDate);

  const startReschedule = () => {
    setError('');
    setWhen(toLocalInput(r.scheduledDate || r.preferredDate));
    setRescheduling(true);
  };

  const saveReschedule = async () => {
    setError('');
    const iso = fromLocalInput(when);
    if (!iso || new Date(iso).getTime() <= Date.now()) {
      setError('Pick a date and time in the future.');
      return;
    }
    setBusy(true);
    const result = await onReschedule(r.id, iso);
    setBusy(false);
    if (result.success) setRescheduling(false);
    else setError(result.error);
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this request?')) return;
    setBusy(true);
    const result = await onCancel(r.id);
    setBusy(false);
    if (!result.success) window.alert(result.error);
  };

  return (
    <div className={`my-request status-${r.status.toLowerCase()} ${isNew ? 'is-new' : ''}`}>
      {isNew && <span className="my-request-new">New update</span>}

      <div className="my-request-car">
        {car?.photos?.[0] && <img src={car.photos[0]} alt="" />}
        <div>
          <span className="my-request-type">{isTest ? 'Test drive' : 'Reservation'}</span>
          <h3>
            {car ? (
              <Link to={`/inventory/${car.id}`}>{car.year} {car.make} {car.model}</Link>
            ) : (
              'Vehicle removed'
            )}
          </h3>
          <span className={`my-request-status ${r.status.toLowerCase()}`}>
            {STATUS_LABELS[r.status] || r.status}
          </span>
        </div>
      </div>

      <div className="my-request-details">
        {isTest && (
          <div><span>You asked for</span><strong>{formatDateTime(r.preferredDate)}</strong></div>
        )}
        {r.status === 'CONFIRMED' && r.scheduledDate && (
          <div className="my-request-confirmed">
            <span>{isTest ? 'Confirmed time' : 'Please visit on'}</span>
            <strong>{formatDateTime(r.scheduledDate)}</strong>
          </div>
        )}
        <div><span>Sent</span><strong>{formatDateTime(r.createdAt)}</strong></div>
      </div>

      {timeChanged && (
        <p className="my-request-changed">
          The dealership suggested a different time than the one you asked for.
        </p>
      )}
      {r.status === 'CONFIRMED' && !isTest && !r.scheduledDate && (
        <p className="my-request-ok">Your reservation is confirmed. The car is held for you.</p>
      )}
      {r.staffNote && <p className="my-request-note">Message from the dealer: "{r.staffNote}"</p>}

      {rescheduling && (
        <div className="my-request-panel">
          <label>
            New date and time
            <input
              type="datetime-local"
              value={when}
              min={toLocalInput(new Date())}
              onChange={(e) => setWhen(e.target.value)}
            />
          </label>
          <small>The dealership will need to confirm the new time again.</small>
          {error && <p className="my-request-error">{error}</p>}
          <div className="my-request-actions">
            <button className="btn-secondary" onClick={() => setRescheduling(false)} disabled={busy}>
              Back
            </button>
            <button className="btn-primary" onClick={saveReschedule} disabled={busy}>
              {busy ? 'Sending...' : 'Send new time'}
            </button>
          </div>
        </div>
      )}

      {!rescheduling && (canReschedule || canCancel) && (
        <div className="my-request-actions">
          {canReschedule && (
            <button className="btn-secondary" onClick={startReschedule} disabled={busy}>
              Change date or time
            </button>
          )}
          {canCancel && (
            <button className="btn-secondary danger" onClick={cancel} disabled={busy}>
              Cancel request
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MyRequests() {
  const { requests, loading, unseenCount, markAllSeen, cancelRequest, rescheduleRequest } = useRequests();

  // Remember which requests were new when the page opened, then mark them as seen
  const [newIds, setNewIds] = useState([]);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || unseenCount === 0) return;
    handled.current = true;
    setNewIds(requests.filter((r) => r.buyerSeen === false).map((r) => r.id));
    markAllSeen();
  }, [unseenCount, requests, markAllSeen]);

  return (
    <div className="my-requests-page">
      <h1>My Requests</h1>
      <p className="my-requests-subtitle">
        Your reservations and test drives, and the dealership's answers.
      </p>

      {loading && requests.length === 0 && <p className="my-requests-empty">Loading...</p>}

      {!loading && requests.length === 0 && (
        <div className="my-requests-empty">
          <p>You have not sent any requests yet.</p>
          <Link to="/inventory" className="btn-primary">Browse inventory</Link>
        </div>
      )}

      <div className="my-requests-list">
        {requests.map((r) => (
          <MyRequestCard
            key={r.id}
            request={r}
            isNew={newIds.includes(r.id)}
            onCancel={cancelRequest}
            onReschedule={rescheduleRequest}
          />
        ))}
      </div>
    </div>
  );
}

export default MyRequests;