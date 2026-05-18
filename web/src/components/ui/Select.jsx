import { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  { className = '', error, children, ...rest },
  ref
) {
  const base =
    'block w-full h-10 px-3 rounded-md border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-100 disabled:text-slate-500';
  const state = error
    ? 'border-red-400 focus:ring-red-300'
    : 'border-slate-300 focus:ring-slate-400';
  return (
    <select ref={ref} className={`${base} ${state} ${className}`} {...rest}>
      {children}
    </select>
  );
});
