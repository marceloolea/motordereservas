import { forwardRef } from 'react';

export const Textarea = forwardRef(function Textarea(
  { className = '', error, rows = 4, ...rest },
  ref
) {
  const base =
    'block w-full px-3 py-2 rounded-md border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-100 disabled:text-slate-500 resize-y';
  const state = error
    ? 'border-red-400 focus:ring-red-300'
    : 'border-slate-300 focus:ring-slate-400';
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`${base} ${state} ${className}`}
      {...rest}
    />
  );
});
