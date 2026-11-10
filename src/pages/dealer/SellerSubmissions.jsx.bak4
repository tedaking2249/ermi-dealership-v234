import { useState } from 'react';
import { useListings } from '../../context/ListingContext';
import './SellerSubmissions.css';

function SellerSubmissions() {
  const { listings, pendingListings, loading, approveListing, rejectListing } = useListings();
  const [activeId, setActiveId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const active = listings.find((l) => l.id === activeId);

  const handleApprove = async (listing) => {
    if (busy) return;
    setBusy(true);
    const result = await approveListing(listing.id);
    setBusy(false);

    if (result.success) {
      setActiveId(null);
    } else {
      window.alert(result.error);
    }
  };

  const handleReject = () => {
    setRejectReason('');
    setRejectError('');
    setRejecting(true);
  };

  const submitReject = async () => {
    if (rejectReason.trim().length < 3) {
      setRejectError('Please give a short reason (at least 3 characters).');
      return;
    }
    if (busy || !active) return;
    setBusy(true);
    const result = await rejectListing(active.id, rejectReason.trim());
    setBusy(false);

    if (result.success) {
      setRejecting(false);
      setActiveId(null);
    } else {
      setRejectError(result.error || 'Could not reject this submission.');
    }
  };

  const cancelReject = () => {
    if (busy) return;
    setRejecting(false);
    setRejectReason('');
    setRejectError('');
  };

  return (
    <div className="submissions-page">
      <h1>Seller Submissions</h1>
      <p className="submissions-subtitle">{pendingListings.length} pending review</p>

      <div className="submissions-layout">
        <div className="submissions-list">
          {loading && pendingListings.length === 0 && (
            <p className="submissions-empty">Loading submissions...</p>
          )}
          {!loading && pendingListings.length === 0 && (
            <p className="submissions-empty">No pending submissions.</p>
          )}
          {pendingListings.map((l) => (
            <button
              key={l.id}
              className={`submission-item ${activeId === l.id ? 'active' : ''}`}
              onClick={() => setActiveId(l.id)}
            >
              <img src={l.photos?.[0]} alt="" className="submission-thumb" />
              <div className="submission-item-text">
                <span className="submission-title">{l.year} {l.make} {l.model}</span>
                <span className="submission-meta">{l.vehicleType} · {l.sellerName}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="submission-detail">
          {!active && <p className="submissions-placeholder">Select a submission to review.</p>}

          {active && (
            <div className="submission-card">
              <div className="submission-photos">
                {(active.photos || []).map((src, i) => (
                  <img key={i} src={src} alt={`Photo ${i + 1}`} />
                ))}
              </div>

              <h2>{active.year} {active.make} {active.model}</h2>

              <div className="submission-fields">
                <div><span>Type</span><strong>{active.vehicleType}</strong></div>
                <div><span>Price</span><strong>{Number(active.price).toLocaleString()} ETB</strong></div>
                <div><span>Mileage</span><strong>{Number(active.mileage).toLocaleString()} km</strong></div>
                <div><span>Body Type</span><strong>{active.bodyType}</strong></div>
                <div><span>Transmission</span><strong>{active.transmission}</strong></div>
                {active.hybridType && <div><span>Hybrid Type</span><strong>{active.hybridType}</strong></div>}
                {active.petrolRange && <div><span>Petrol Range</span><strong>{active.petrolRange}</strong></div>}
                {active.combinedRange && <div><span>Combined Range</span><strong>{active.combinedRange}</strong></div>}
                {active.evRange && <div><span>EV Range</span><strong>{active.evRange}</strong></div>}
                {active.chargingInfo && <div><span>Charging Info</span><strong>{active.chargingInfo}</strong></div>}
                {active.batteryCondition && <div><span>Battery Condition</span><strong>{active.batteryCondition}</strong></div>}
                {active.vin && <div><span>VIN</span><strong>{active.vin}</strong></div>}
              </div>

              {active.features?.length > 0 && (
                <div className="submission-tags">
                  <span>Features:</span>
                  {active.features.map((f) => <span key={f} className="tag">{f}</span>)}
                </div>
              )}

              {active.majorIssues?.length > 0 && (
                <div className="submission-tags">
                  <span>Known Issues:</span>
                  {active.majorIssues.map((m) => <span key={m} className="tag issue">{m}</span>)}
                </div>
              )}

              <div className="submission-seller">
                <span>Seller</span>
                <strong>{active.sellerName} — {active.sellerPhone}</strong>
              </div>

              <div className="submission-actions">
                <button className="btn-primary" onClick={() => handleApprove(active)} disabled={busy}>
                  {busy ? 'Working...' : 'Approve & Publish'}
                </button>
                <button className="btn-reject" onClick={handleReject} disabled={busy}>
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {rejecting && active && (
        <div className="reject-modal-backdrop" onClick={cancelReject}>
          <div className="reject-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Reject submission</h2>
            <p>
              {active.year} {active.make} {active.model} — {active.sellerName}
            </p>
            <label>
              Rejection reason (required)
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="e.g. Incomplete vehicle details, invalid photo..."
                disabled={busy}
              />
            </label>
            {rejectError && <p className="reject-modal-error">{rejectError}</p>}
            <div className="reject-modal-actions">
              <button type="button" className="btn-secondary" onClick={cancelReject} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="btn-reject" onClick={submitReject} disabled={busy}>
                {busy ? 'Working...' : 'Submit Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerSubmissions;