import { useState } from 'react';
import {
  IoSearchOutline, IoShieldCheckmarkOutline, IoInformationCircleOutline,
} from 'react-icons/io5';
import { readVin, validateVinFormat, checkDigit, identifyManufacturer, decodeVinApi, cleanLookup } from '../utils/vin';
import { lookupSites, lookupUrl } from '../data/lookupSites';
import { IoOpenOutline } from 'react-icons/io5';
import { brands, generalTools } from '../data/verifyLinks';
import './GoogleMyCar.css';

function GoogleMyCar() {
  const [vin, setVin] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [apiError, setApiError] = useState('');
  const [wmiManufacturer, setWmiManufacturer] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [nonStandard, setNonStandard] = useState(false);

  const query = cleanLookup(vin);
  const charCount = vin.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setApiData(null);
    setResult(null);
    setWmiManufacturer('');
    const q = cleanLookup(vin);
    if (!q) return;
    setSubmitted(q);
    const v = validateVinFormat(q);
    if (!v.valid) {
      setNonStandard(true);
      return;
    }
    setNonStandard(false);
    const offline = readVin(v.vin);
    setResult(offline);
    setWmiManufacturer(identifyManufacturer(v.vin));
    setLoading(true);
    try {
      const row = await decodeVinApi(v.vin);
      setApiData(row);
    } catch (err) {
      setApiError(err.message || 'Could not decode this VIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gmc-page">
      <header className="gmc-hero">
        <span className="gmc-hero-icon"><IoShieldCheckmarkOutline /></span>
        <h1>Google my car</h1>
        <p>
          Check a car before you buy it. Read the real model year from the VIN, then confirm it on the
          ToyoDIY or VinDecoderz.
        </p>
      </header>

      <section className="gmc-card" aria-labelledby="gmc-vin-title">
        <h2 id="gmc-vin-title">1. Read the VIN</h2>
        <p className="gmc-help">
          A standard VIN has 17 characters, but you can also type a shorter chassis number. Look for it on the car papers (Libre), at the bottom of the
          windscreen on the driver's side, or on the door frame.
        </p>

        <form className="gmc-form" onSubmit={handleSubmit}>
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
            <span className="gmc-char-count" aria-live="polite">{charCount}</span>
          </div>
          <button type="submit" className="gmc-btn" disabled={loading || query.length < 3}>
            <IoSearchOutline /> {loading ? 'Decoding...' : 'Check'}
          </button>
        </form>

        {nonStandard && submitted && (
          <p className="gmc-note" role="status">
            "{submitted}" is not a standard 17-character VIN, so the model year cannot be read from it
            here. Use the two websites below: they open with your number already filled in.
          </p>
        )}
        {result && !result.ok && <p className="gmc-error" role="alert">{result.message}</p>}

        {result?.ok && (
          <div className="gmc-result" role="status">
            <div className="gmc-year">
              <span>Model year</span>
              <strong>{(apiData && apiData.ModelYear) || result.year}</strong>
            </div>

            <h3 className="gmc-section-title">VIN Overview</h3>
            <dl>
              <dt>VIN</dt><dd className="gmc-mono">{result.vin}</dd>
              <dt>Manufacturer / Make</dt><dd>{(apiData && (apiData.Make || apiData.Manufacturer)) || result.maker || 'Not available'}</dd>
              <dt>Model year</dt><dd>{(apiData && apiData.ModelYear) || result.year}</dd>
              <dt>Country of manufacture</dt><dd>{(apiData && apiData.PlantCountry) || result.country || 'Not available'}</dd>
            </dl>

            <h3 className="gmc-section-title">Vehicle Specifications</h3>
            <dl>
              <dt>Model</dt><dd>{(apiData && apiData.Model) || 'Not available'}</dd>
              <dt>Trim / Series</dt><dd>{(apiData && (apiData.Trim || apiData.Series)) || 'Not available'}</dd>
              <dt>Body type</dt><dd>{(apiData && apiData.BodyClass) || 'Not available'}</dd>
              <dt>Vehicle type</dt><dd>{(apiData && apiData.VehicleType) || 'Not available'}</dd>
              <dt>Vehicle class</dt><dd>{(apiData && apiData.VehicleClass) || 'Not available'}</dd>
              <dt>Number of doors</dt><dd>{(apiData && apiData.Doors) || 'Not available'}</dd>
              <dt>Engine configuration</dt><dd>{(apiData && apiData.EngineConfiguration) || 'Not available'}</dd>
              <dt>Engine displacement</dt><dd>{(apiData && (apiData.DisplacementL ? apiData.DisplacementL + ' L' : (apiData.DisplacementCI ? apiData.DisplacementCI + ' ci' : 'Not available'))) || 'Not available'}</dd>
              <dt>Number of cylinders</dt><dd>{(apiData && apiData.EngineCylinders) || 'Not available'}</dd>
              <dt>Fuel type</dt><dd>{(apiData && apiData.FuelTypePrimary) || 'Not available'}</dd>
              <dt>Transmission type</dt><dd>{(apiData && apiData.TransmissionStyle) || 'Not available'}</dd>
              <dt>Drive type</dt><dd>{(apiData && apiData.DriveType) || 'Not available'}</dd>
              <dt>Manufacturing / Assembly plant</dt><dd>{(apiData && [apiData.PlantCity, apiData.PlantState, apiData.PlantCountry].filter(Boolean).join(', ')) || 'Not available'}</dd>
              <dt>Manufacturer name</dt><dd>{(apiData && apiData.Manufacturer) || result.maker || 'Not available'}</dd>
            </dl>

            <h3 className="gmc-section-title">VIN Verification</h3>
            <ul className="gmc-verify-list">
              <li className="gmc-verify-item gmc-status-ok">
                <span>Valid VIN Format</span><span className="gmc-status-badge">Pass</span>
              </li>
              <li className={`gmc-verify-item ${checkDigit(result.vin) === 'pass' ? 'gmc-status-ok' : checkDigit(result.vin) === 'fail' ? 'gmc-status-fail' : 'gmc-status-warn'}`}>
                <span>Check Digit</span>
                <span className="gmc-status-badge">
                  {checkDigit(result.vin) === 'pass' ? 'Passed' : checkDigit(result.vin) === 'fail' ? 'Failed' : 'Not applicable'}
                </span>
              </li>
              <li className={`gmc-verify-item ${wmiManufacturer ? 'gmc-status-ok' : 'gmc-status-warn'}`}>
                <span>Manufacturer Identified</span>
                <span className="gmc-status-badge">{wmiManufacturer || 'Not identified'}</span>
              </li>
              <li className={`gmc-verify-item ${apiData ? 'gmc-status-ok' : apiError ? 'gmc-status-fail' : 'gmc-status-warn'}`}>
                <span>Vehicle Information Retrieved</span>
                <span className="gmc-status-badge">{apiData ? 'Yes' : apiError ? 'No' : 'Pending'}</span>
              </li>
              {apiData && (
                <li className="gmc-verify-item gmc-status-ok">
                  <span>Decoding Status</span><span className="gmc-status-badge">Decoded</span>
                </li>
              )}
              {apiError && (
                <li className="gmc-verify-item gmc-status-fail">
                  <span>Decoding Status</span><span className="gmc-status-badge">Failed</span>
                </li>
              )}
              {apiData && (
                <li className="gmc-verify-item gmc-status-warn">
                  <span>Incomplete Vehicle Information</span>
                  <span className="gmc-status-badge">
                    {(() => {
                      const fields = [apiData.Model, apiData.ModelYear, apiData.Make, apiData.BodyClass, apiData.FuelTypePrimary];
                      const missing = fields.filter((f) => !f || String(f).trim() === '' || String(f).trim().toUpperCase() === 'NOT AVAILABLE').length;
                      return missing > 0 ? 'Some fields missing' : 'No';
                    })()}
                  </span>
                </li>
              )}
              <li className="gmc-verify-item gmc-status-warn">
                <span>Physical Vehicle Verification Required</span>
                <span className="gmc-status-badge">Required</span>
              </li>
            </ul>

            {wmiManufacturer && apiData && (apiData.Make || apiData.Manufacturer) && (
              <p className="gmc-note">
                WMI-identified manufacturer: {wmiManufacturer}. Decoded manufacturer: {apiData.Make || apiData.Manufacturer}.
                {wmiManufacturer.toLowerCase().includes(String(apiData.Make || apiData.Manufacturer || '').toLowerCase())
                  ? ' They match.'
                  : ' They may differ; verify with official records.'}
              </p>
            )}
            {result.note && <p className="gmc-note">{result.note}</p>}
            {loading && <p className="gmc-help">Decoding VIN with manufacturer database...</p>}
            {apiError && <p className="gmc-error" role="alert">{apiError}</p>}
            <p className="gmc-note">
              This reads the code inside the VIN. Always compare it with the year on the car papers and
              confirm it with the two websites below.
            </p>
          </div>
        )}

        <div className="gmc-warning">
          <IoInformationCircleOutline />
          <p>
            Cars imported from Japan often have only a short chassis number such as NZE141-1234567.
            That number does not contain the year. For those cars, ask for the export certificate or
            ask the maker's dealer to check it.
          </p>
        </div>
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
            VIN decoding identifies the information encoded in a vehicle identification number. It does
            not independently prove that a physical vehicle is genuine, has never been stolen, or has
            never been damaged. Always compare the VIN on the vehicle with its registration documents
            and verify it through appropriate manufacturer or official records.
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

