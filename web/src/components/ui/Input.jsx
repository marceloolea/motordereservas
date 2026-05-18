import { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  { className = '', error, ...rest },
  ref
) {
  const base =
    'block w-full h-10 px-3 rounded-md border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-100 disabled:text-slate-500';
  const state = error
    ? 'border-red-400 focus:ring-red-300'
    : 'border-slate-300 focus:ring-slate-400';
  return <input ref={ref} className={`${base} ${state} ${className}`} {...rest} />;
});
