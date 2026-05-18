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

export const todayISO = () => {
  const d = new Date();
  const tz = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const y = tz.getFullYear();
  const m = String(tz.getMonth() + 1).padStart(2, '0');
  const day = String(tz.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
