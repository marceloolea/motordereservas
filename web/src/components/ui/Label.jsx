export function Label({ htmlFor, children, className = '' }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-slate-700 mb-1 ${className}`}
    >
      {children}
    </label>
  );
}
