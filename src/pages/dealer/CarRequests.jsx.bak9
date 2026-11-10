import { Fragment, useEffect, useState } from 'react';
import api from '../../services/api';

const STATUSES = ['NEW', 'CONTACTED', 'CLOSED'];
const digits = (p) => String(p).replace(/[^\d]/g, '').replace(/^0/, '251');

export default function CarRequests() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/need-requests', { params: filter ? { status: filter } : {} })
      .then((r) => setRows(r.data.data || []))
      .catch(() => setError('Could not load requests.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = async (id, status) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await api.patch(`/need-requests/${id}`, { status });
      window.dispatchEvent(new Event('ermi:needs-changed'));
    } catch { load(); }
  };

  const box = { padding: 20, maxWidth: 1100, margin: '0 auto' };
  const cell = { padding: '10px 8px', borderBottom: '1px solid rgba(128,128,128,.25)', textAlign: 'start', verticalAlign: 'top' };

  return (
    <div style={box}>
      <h1 style={{ marginBottom: 12 }}>Car requests</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['', ...STATUSES].map((s) => (
          <button key={s || 'all'} onClick={() => setFilter(s)}
            style={{ padding: '6px 14px', borderRadius: 99, border: '1px solid currentColor', opacity: filter === s ? 1 : 0.55, background: 'none', color: 'inherit', cursor: 'pointer' }}>
            {s || 'ALL'}
          </button>
        ))}
      </div>
      {error && <p>{error}</p>}
      {loading ? <p>Loading…</p> : rows.length === 0 ? <p>No requests yet.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
            <thead><tr>{['Date', 'Customer', 'Wants', 'Budget', 'Contact', 'Status'].map((h) => <th key={h} style={cell}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
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
                      <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                  {open === r.id && (
                    <tr><td colSpan={6} style={{ ...cell, background: 'rgba(128,128,128,.08)' }}>
                      <div>Pay: {r.payment} · Transmission: {r.transmission || '—'} · Fuel: {r.fuel || '—'} · Body: {r.body || '—'}</div>
                      <div>Matters: {(r.priorities || []).join(', ') || '—'}</div>
                      <div>Broker experience: {r.brokerExperience || '—'} {r.brokerFeedback ? `· "${r.brokerFeedback}"` : ''}</div>
                      <div>Heard via: {r.source || '—'} · Language: {r.lang}</div>
                      <div>Wants improved: {(r.improvements || []).join(', ') || '—'}</div>
                      {r.notes && <div>Notes: {r.notes}</div>}
                      {(r.photos || []).length > 0 && <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {r.photos.map((p, i) => <img key={i} src={p} alt="" style={{ height: 120, borderRadius: 8 }} />)}</div>}
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