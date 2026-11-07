import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useListings } from '../context/ListingContext';
import { useLanguage } from '../context/LanguageContext';
import './MySubmissions.css';

const STATUS_LABELS = {
  en: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' },
  am: { pending: 'በመጠባበቅ ላይ', approved: 'ጸድቋል', rejected: 'ውድቅ ተደርጓል' },
};

function MySubmissions() {
  const { listings, loading } = useListings();
  const { lang } = useLanguage();

  useEffect(() => {
    // listings are loaded by ListingContext for the signed-in user
  }, []);

  const labels = STATUS_LABELS[lang] || STATUS_LABELS.en;

  return (
    <div className="my-submissions-page">
      <h1>{lang === 'am' ? 'የእኔ የቀረቡ መኪኖች' : 'My Submissions'}</h1>
      <p className="my-submissions-subtitle">
        {lang === 'am' ? 'የእርስዎ የመኪና ማቅረቢያ ሁኔታ እና ውጤት።' : 'Status and results of your vehicle submissions.'}
      </p>

      {loading && listings.length === 0 && <p className="my-submissions-empty">Loading...</p>}

      {!loading && listings.length === 0 && (
        <div className="my-submissions-empty">
          <p>{lang === 'am' ? 'እስካሁን ማንኛውም መኪና አልቀረቡም።' : 'You have not submitted any vehicles yet.'}</p>
          <Link to="/sell" className="btn-primary">Sell Your Car</Link>
        </div>
      )}

      <div className="my-submissions-list">
        {listings.map((l) => (
          <div key={l.id} className={`my-submission-card status-${l.status}`}>
            {l.photos?.[0] && <img src={l.photos[0]} alt="" className="my-submission-thumb" />}
            <div className="my-submission-body">
              <div className="my-submission-title">
                {l.year} {l.make} {l.model}
              </div>
              <div className="my-submission-meta">
                {l.vehicleType || l.fuelType} · {Number(l.price).toLocaleString()} ETB
              </div>
              <span className={`my-submission-status ${l.status}`}>
                {labels[l.status] || l.status}
              </span>
              {l.status === 'rejected' && l.rejectionReason && (
                <div className="my-submission-rejected">
                  {lang === 'am'
                    ? `የቀረበው ማመልከቻ ውድቅ ተደርጓል፡ ${l.rejectionReason}`
                    : `Submission Rejected: ${l.rejectionReason}`}
                </div>
              )}
              {l.status === 'approved' && l.vehicleId && (
                <Link to={`/inventory/${l.vehicleId}`} className="my-submission-link">
                  {lang === 'am' ? 'መኪናውን ይመልከቱ' : 'View vehicle'}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MySubmissions;
