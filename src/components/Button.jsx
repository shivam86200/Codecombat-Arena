import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white shadow-lg shadow-primary-900/30 disabled:bg-primary-900 disabled:text-primary-700',
  outline:
    'border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white bg-transparent hover:bg-slate-800/60',
  ghost:
    'text-slate-400 hover:text-white hover:bg-slate-800/60 bg-transparent',
  danger:
    'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  fullWidth = false,
  icon: Icon,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center gap-2
        font-semibold rounded-lg transition-all duration-200
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
};

export default Button;
