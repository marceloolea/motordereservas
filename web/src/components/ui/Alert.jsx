const variants = {
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
};

export function Alert({ variant = 'error', children, className = '' }) {
  return (
    <div
      role="alert"
      className={`rounded-md border px-3 py-2 text-sm ${variants[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
