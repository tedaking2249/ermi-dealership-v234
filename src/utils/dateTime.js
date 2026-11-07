const pad = (n) => String(n).padStart(2, '0');

// "Mon, Oct 26, 2026, 2:00 PM" in the viewer's own time zone
export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

// Date or ISO string -> "2026-10-26T14:00" for <input type="datetime-local">
export const toLocalInput = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const toLocalDate = (value) => toLocalInput(value).slice(0, 10);

// "2026-10-26T14:00" (local time) -> ISO string the API expects, or null if invalid
export const fromLocalInput = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export const sameMoment = (a, b) => Math.abs(new Date(a) - new Date(b)) < 60000;