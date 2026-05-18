const STATUS_STYLES = {
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  confirmed: {
    label: 'Confirmada',
    className: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  completed: {
    label: 'Completada',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

export function StatusBadge({ status, className = '' }) {
  const s = STATUS_STYLES[status] || {
    label: status,
    className: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${s.className} ${className}`}
    >
      {s.label}
    </span>
  );
}

export const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'cancelled', label: 'Canceladas' },
];
