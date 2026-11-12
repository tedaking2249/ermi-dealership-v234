import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  IoShieldCheckmarkOutline, IoInformationCircleOutline, IoOpenOutline, IoCloseCircle,
} from 'react-icons/io5';
import { cleanLookup } from '../utils/vin';
import { lookupSites, lookupUrl } from '../data/lookupSites';
import './GoogleMyCar.css';

function GoogleMyCar() {
  const { t } = useLanguage();
  const [vin, setVin] = useState('');

  const query = cleanLookup(vin);

  return (
    <div className="gmc-page">
      <header className="gmc-hero">
        <span className="gmc-hero-icon"><IoShieldCheckmarkOutline /></span>
        <h1>{t('google.mycar')}</h1>
        <p>
          Type the VIN or chassis number once. Then open one of the two websites below and it
          opens with your number already filled in.
        </p>
      </header>

      <section className="gmc-card" aria-labelledby="gmc-vin-title">
        <h2 id="gmc-vin-title">1. Enter the VIN</h2>
        <p className="gmc-help">
          A standard VIN has 17 characters, but you can also type a shorter chassis number. Look for it on the car papers (Libre), at the bottom of the
          windscreen on the driver's side, or on the door frame.
        </p>

        <form className="gmc-form" onSubmit={(e) => e.preventDefault()}>
          <div className="gmc-input-wrap">
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
              placeholder="VIN or chassis number, e.g. NZE141-1234567"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck="false"
              aria-label="VIN or chassis number"
            />
            {vin ? (
              <button type="button" className="gmc-clear" onClick={() => setVin('')} aria-label="Clear">
                <IoCloseCircle />
              </button>
            ) : (
              <span className="gmc-char-count" aria-live="polite">{vin.length}</span>
            )}
          </div>
        </form>
      </section>

      <section className="gmc-section" aria-labelledby="gmc-sites-title">
        <h2 id="gmc-sites-title">2. Check on these websites</h2>
        <p className="gmc-help">
          {query
            ? 'Your number is filled in for you. Each button opens the website in a new tab.'
            : 'Type a VIN or chassis number above. The buttons then open each website with your number already filled in.'}
        </p>
        {query && (
          <p className="gmc-site-number">Your number: <code>{query}</code></p>
        )}
        <div className="gmc-site-grid">
          {lookupSites.map((site) => (
            <article key={site.name} className="gmc-site-card">
              <div className="gmc-site-top">
                <span className="gmc-site-mark" aria-hidden="true">{site.name.charAt(0)}</span>
                <div>
                  <h3>{site.name}</h3>
                  <small>{site.host}</small>
                </div>
              </div>
              <p className="gmc-site-text">{site.text}</p>
              <ul className="gmc-site-tags">
                {site.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
              <a
                className="gmc-site-btn"
                href={query ? lookupUrl(site, query) : site.home}
                target="_blank"
                rel="noreferrer noopener"
              >
                {query ? 'Open with this number' : `Open ${site.host}`} <IoOpenOutline />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="gmc-section" aria-labelledby="gmc-vin-info-title">
        <h2 id="gmc-vin-info-title">Important information</h2>
        <div className="gmc-warning">
          <IoInformationCircleOutline />
          <p>
            These websites show what is recorded for a VIN. They do not independently prove that a
            physical vehicle is genuine, has never been stolen, or has never been damaged. Always
            compare the VIN on the vehicle with its registration documents and verify it through
            appropriate manufacturer or official records.
          </p>
        </div>
        <p className="gmc-help">
          You can find your VIN in the vehicle registration documents, at the bottom of the windscreen
          on the driver's side, or on the driver-side door frame.
        </p>
      </section>
    </div>
  );
}

export default GoogleMyCar;