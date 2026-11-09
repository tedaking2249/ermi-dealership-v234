import { useCallback, useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell,
} from 'recharts';
import api, { getErrorMessage } from '../../services/api';
import './Analytics.css';

const COLORS = {
  blue: '#2563eb', green: '#16a34a', amber: '#d97706',
  red: '#dc2626', violet: '#7c3aed', slate: '#64748b',
};
const PIE_COLORS = [COLORS.green, COLORS.amber, COLORS.slate, COLORS.blue, COLORS.violet, COLORS.red];

const PERIODS = [
  { key: 'day', label: 'Daily', hint: 'Last 30 days' },
  { key: 'week', label: 'Weekly', hint: 'Last 12 weeks' },
  { key: 'month', label: 'Monthly', hint: 'Last 12 months' },
  { key: 'year', label: 'Yearly', hint: 'Last 5 years' },
];

const REQUEST_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'DECLINED', 'CANCELLED'];

const formatNumber = (n) => Number(n || 0).toLocaleString();
const titleCase = (s) => s.charAt(0) + s.slice(1).toLowerCase();
const sumOf = (rows, keys) => rows.reduce((sum, row) => sum + keys.reduce((s, k) => s + (row[k] || 0), 0), 0);

// Buckets arrive as "YYYY-MM-DD" in dealership local time
const parseBucket = (bucket) => new Date(`${bucket}T00:00:00Z`);

function shortLabel(bucket, period) {
  const d = parseBucket(bucket);
  if (period === 'year') return String(d.getUTCFullYear());
  if (period === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function longLabel(bucket, period) {
  const d = parseBucket(bucket);
  if (period === 'year') return String(d.getUTCFullYear());
  if (period === 'month') return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const text = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return period === 'week' ? `Week of ${text}` : text;
}

function Tile({ label, value, note }) {
  return (
    <div className="an-tile">
      <span className="an-tile-label">{label}</span>
      <strong className="an-tile-value">{value}</strong>
      {note && <span className="an-tile-note">{note}</span>}
    </div>
  );
}

function Card({ title, subtitle, actions, children }) {
  return (
    <section className="an-card">
      <header className="an-card-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

function ChartBox({ empty, children }) {
  return (
    <div className="an-chart">
      {empty ? <p className="an-empty">No data yet.</p> : children}
    </div>
  );
}

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('day');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: result } = await api.get('/analytics');
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load the analytics.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <div className="an-page">
        <h1>Analytics</h1>
        {loading && <p className="an-status">Loading analytics...</p>}
        {error && (
          <div className="an-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={load}>Try again</button>
          </div>
        )}
      </div>
    );
  }

  const {
    totals, logins, loginTracking, vehiclesMonthly, listingsMonthly,
    registrationsDaily, inventory, requests,
  } = data;

  const vehicles = totals.vehicles;
  const listings = totals.listings;
  const loginRows = logins ? logins[period] : [];
  const loginsEmpty = sumOf(loginRows, ['signins']) === 0;
  const periodInfo = PERIODS.find((p) => p.key === period);

  const statusPie = [
    { name: 'Available', value: vehicles.AVAILABLE },
    { name: 'Reserved', value: vehicles.RESERVED },
    { name: 'Sold', value: vehicles.SOLD },
  ].filter((s) => s.value > 0);

  const monthTick = (b) => shortLabel(b, 'month');
  const monthTip = (b) => longLabel(b, 'month');

  return (
    <div className="an-page">
      <div className="an-header">
        <div>
          <h1>Analytics</h1>
          <p className="an-sub">
            Updated {new Date(data.generatedAt).toLocaleString()} · times in Ethiopian local time
          </p>
        </div>
        <button type="button" className="an-refresh" onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {error && <p className="an-error" role="alert">{error}</p>}

      <div className="an-tiles">
        <Tile label="Total users" value={formatNumber(totals.users)} note={`+${formatNumber(totals.newUsersLast30Days)} in the last 30 days`} />
        <Tile label="Cars listed (all time)" value={formatNumber(vehicles.AVAILABLE + vehicles.RESERVED + vehicles.SOLD)} />
        <Tile label="Cars in stock" value={formatNumber(vehicles.AVAILABLE + vehicles.RESERVED)} note={`${formatNumber(vehicles.RESERVED)} reserved`} />
        <Tile label="Cars sold" value={formatNumber(vehicles.SOLD)} note={`${formatNumber(totals.carsSoldLast30Days)} in the last 30 days`} />
        <Tile label="Total sales value" value={`${formatNumber(totals.totalSalesValue)} ETB`} />
        <Tile label="Avg. days to sell" value={totals.avgDaysToSell == null ? '—' : `${totals.avgDaysToSell} days`} note="From listing to sale" />
        <Tile label="Seller submissions" value={formatNumber(listings.PENDING + listings.APPROVED + listings.REJECTED)} note={`${formatNumber(listings.APPROVED)} approved · ${formatNumber(listings.REJECTED)} rejected`} />
        <Tile label="Waiting for review" value={formatNumber(listings.PENDING)} />
      </div>

      <Card
        title="User logins"
        subtitle={`${periodInfo.hint}. Sign-ins count every login; unique users count each person once per period.`}
        actions={(
          <div className="an-toggle" role="group" aria-label="Time period">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={period === p.key ? 'active' : ''}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      >
        {!loginTracking ? (
          <p className="an-note">Login tracking is not available yet, so no sign-in history can be shown.</p>
        ) : (
          <>
            <ChartBox empty={false}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loginRows} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="bucket" tickFormatter={(b) => shortLabel(b, period)} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(b) => longLabel(b, period)} />
                  <Legend />
                  <Line type="monotone" dataKey="signins" name="Sign-ins" stroke={COLORS.blue} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="users" name="Unique users" stroke={COLORS.green} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
            {loginsEmpty && (
              <p className="an-note">
                No sign-ins in this period yet. Login history starts from the day tracking was switched on.
              </p>
            )}
          </>
        )}
      </Card>

      <div className="an-grid">
        <Card title="Cars listed vs sold" subtitle="Added to inventory and sold, per month">
          <ChartBox empty={sumOf(vehiclesMonthly, ['listed', 'sold']) === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehiclesMonthly} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" tickFormatter={monthTick} />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={monthTip} />
                <Legend />
                <Bar dataKey="listed" name="Listed" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="sold" name="Sold" fill={COLORS.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>

        <Card title="Seller submissions" subtitle="Cars submitted by sellers, by review outcome">
          <ChartBox empty={sumOf(listingsMonthly, ['submitted']) === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={listingsMonthly} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" tickFormatter={monthTick} />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={monthTip} />
                <Legend />
                <Bar dataKey="approved" name="Approved" stackId="s" fill={COLORS.green} />
                <Bar dataKey="pending" name="Pending" stackId="s" fill={COLORS.amber} />
                <Bar dataKey="rejected" name="Rejected" stackId="s" fill={COLORS.red} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>

        <Card title="New registrations" subtitle="Accounts created, last 30 days">
          <ChartBox empty={sumOf(registrationsDaily, ['count']) === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={registrationsDaily} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bucket" tickFormatter={(b) => shortLabel(b, 'day')} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={(b) => longLabel(b, 'day')} />
                <Bar dataKey="count" name="New users" fill={COLORS.violet} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>

        <Card title="Inventory status" subtitle="All cars ever listed">
          <ChartBox empty={statusPie.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusPie.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>

        <Card title="Stock by fuel type" subtitle="Cars not yet sold">
          <ChartBox empty={inventory.byFuel.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={inventory.byFuel} dataKey="count" nameKey="name" outerRadius={90}>
                  {inventory.byFuel.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>

        <Card title="Stock by make" subtitle="Top 8 makes, cars not yet sold">
          <ChartBox empty={inventory.byMake.length === 0}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventory.byMake} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} />
                <Tooltip />
                <Bar dataKey="count" name="Cars" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>
      </div>

      <Card title="Reservations and test drives" subtitle="Customer requests by status">
        <div className="an-table-wrap">
          <table className="an-table">
            <thead>
              <tr>
                <th>Type</th>
                {REQUEST_STATUSES.map((s) => <th key={s}>{titleCase(s)}</th>)}
              </tr>
            </thead>
            <tbody>
              {[['RESERVE', 'Reservations'], ['TEST_DRIVE', 'Test drives']].map(([key, label]) => (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  {REQUEST_STATUSES.map((s) => <td key={s}>{formatNumber(requests[key]?.[s])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default Analytics;