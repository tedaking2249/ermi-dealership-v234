import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const STATUSES = ['NEW', 'CONTACTED', 'CLOSED'];
const digits = (p) => String(p).replace(/[^\d]/g, '').replace(/^0/, '251');

export default function CarRequests() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(null);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/need-requests', { params: filter && filter !== 'PUBLISHED' ? { status: filter } : {} })
      .then((r) => setRows(r.data.data || []))
      .catch(() => setError('Could not load requests.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (id, body) => {
    setBusyId(id);
    try {
      const { data } = await api.patch(`/need-requests/${id}`, body);
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...data.data } : r)));
      window.dispatchEvent(new Event('ermi:needs-changed'));
    } catch {
      window.alert('Could not save the change. Please try again.');
      load();
    } finally { setBusyId(null); }
  };

  const shown = filter === 'PUBLISHED' ? rows.filter((r) => r.published) : rows;
  const cell = { padding: '10px 8px', borderBottom: '1px solid rgba(128,128,128,.25)', textAlign: 'start', verticalAlign: 'top' };
  const pill = (on) => ({ padding: '6px 14px', borderRadius: 99, border: '1px solid currentColor', opacity: on ? 1 : 0.55, background: 'none', color: 'inherit', cursor: 'pointer' });

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Car requests</h1>
        <Link to="/customer-requests" target="_blank">View public page ↗</Link>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['', ...STATUSES, 'PUBLISHED'].map((s) => (
          <button key={s || 'all'} onClick={() => setFilter(s)} style={pill(filter === s)}>{s || 'ALL'}</button>
        ))}
      </div>
      {error && <p>{error}</p>}
      {loading ? <p>Loading…</p> : shown.length === 0 ? <p>No requests here.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead><tr>{['Date', 'Customer', 'Wants', 'Budget', 'Contact', 'Status', 'Public'].map((h) => <th key={h} style={cell}>{h}</th>)}</tr></thead>
            <tbody>
              {shown.map((r) => (
                <Fragment key={r.id}>
                  <tr onClick={() => setOpen(open === r.id ? null : r.id)} style={{ cursor: 'pointer' }}>
                    <td style={cell}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td style={cell}><b>{r.name}</b><br />{r.phone}</td>
                    <td style={cell}>{r.make} {r.model} {r.year || ''}<br /><small>{r.intention}</small></td>
                    <td style={cell}>{r.budget ? Number(r.budget).toLocaleString() : '—'}</td>
                    <td style={cell} onClick={(e) => e.stopPropagation()}>
                      {r.contactMethod === 'WhatsApp'
                        ? <a href={`https://wa.me/${digits(r.phone)}`} target="_blank" rel="noreferrer">WhatsApp</a>
                        : r.contactMethod === 'Call' ? <a href={`tel:${r.phone}`}>Call</a> : 'In person'}
                    </td>
                    <td style={cell} onClick={(e) => e.stopPropagation()}>
                      <select value={r.status} onChange={(e) => patch(r.id, { status: e.target.value })}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={cell}>
                      {r.published ? <b style={{ color: '#16a34a' }}>● Published{r.urgent ? ' · High demand' : ''}</b> : <span style={{ opacity: 0.6 }}>—</span>}
                    </td>
                  </tr>
                  {open === r.id && (
                    <tr><td colSpan={7} style={{ ...cell, background: 'rgba(128,128,128,.08)' }}>
                      <div>Pay: {r.payment} · Transmission: {r.transmission || '—'} · Fuel: {r.fuel || '—'} · Body: {r.body || '—'}</div>
                      <div>Matters: {(r.priorities || []).join(', ') || '—'}</div>
                      <div>Broker experience: {r.brokerExperience || '—'} {r.brokerFeedback ? `· "${r.brokerFeedback}"` : ''}</div>
                      <div>Heard via: {r.source || '—'} · Language: {r.lang}</div>
                      <div>Wants improved: {(r.improvements || []).join(', ') || '—'}</div>
                      {r.notes && <div>Notes: {r.notes}</div>}
                      {(r.photos || []).length > 0 && <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {r.photos.map((p, i) => <img key={i} src={p} alt="" style={{ height: 120, borderRadius: 8 }} />)}</div>}

                      <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: '1px solid rgba(128,128,128,.35)' }}>
                        <b>Customer Requests page</b>
                        <p style={{ margin: '4px 0 10px', opacity: 0.75, fontSize: '.85rem' }}>
                          Publishing shows the car details, budget and photos to everyone. The customer's name and phone are never shown.
                        </p>
                        <label style={{ display: 'block', marginBottom: 8 }}>
                          Public note (optional)
                          <textarea rows={2} maxLength={200} style={{ width: '100%', display: 'block', marginTop: 4 }}
                            placeholder="e.g. Customer is ready to buy this week"
                            value={notes[r.id] ?? r.publicNote ?? ''}
                            onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
                        </label>
                        <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                          <input type="checkbox" checked={!!r.urgent} disabled={busyId === r.id}
                            onChange={(e) => patch(r.id, { urgent: e.target.checked })} />
                          Mark as high demand
                        </label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {!r.published ? (
                            <button className="btn-primary" disabled={busyId === r.id}
                              onClick={() => patch(r.id, { published: true, publicNote: (notes[r.id] ?? r.publicNote ?? '').trim() || null })}>
                              Publish to Customer Requests
                            </button>
                          ) : (
                            <>
                              <button className="btn-primary" disabled={busyId === r.id}
                                onClick={() => patch(r.id, { publicNote: (notes[r.id] ?? r.publicNote ?? '').trim() || null })}>
                                Save note
                              </button>
                              <button className="btn-secondary" disabled={busyId === r.id} onClick={() => patch(r.id, { published: false })}>
                                Unpublish
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </td></tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}