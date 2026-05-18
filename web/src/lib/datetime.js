export const TIMEZONE = 'America/Santiago';

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

export const dayLabel = (dow) =>
  DAYS_OF_WEEK.find((d) => d.value === Number(dow))?.label || '';

export const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${h.padStart(2, '0')}:${m}`;
};

export const formatDateCL = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

export const chileNow = () => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const hh = get('hour') === '24' ? '00' : get('hour');
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hh}:${get('minute')}`,
  };
};

export const todayISO = () => chileNow().date;

export const isBookingEndPassed = (bookingDate, endTime) => {
  const now = chileNow();
  if (bookingDate < now.date) return true;
  if (bookingDate > now.date) return false;
  return endTime <= now.time;
};

export const addDaysISO = (isoDate, days) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

export const dayOfWeekFromISO = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const longDateCL = (isoDate) => {
  if (!isoDate) return '';
  const dow = DAYS_OF_WEEK[dayOfWeekFromISO(isoDate)].label;
  const [y, m, d] = isoDate.split('-');
  return `${dow} ${d}/${m}/${y}`;
};
