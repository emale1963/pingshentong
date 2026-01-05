'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-[var(--radius-base)] transition-all duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-[var(--color-brand-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-primary-hover)]',
    secondary: 'bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-secondary)]',
    danger: 'bg-[var(--color-error)] text-[var(--color-text-inverse)] hover:bg-red-600',
    success: 'bg-[var(--color-success)] text-[var(--color-text-inverse)] hover:bg-emerald-600',
  };

  const sizeStyles = {
    sm: 'px-3 py-2 text-xs min-h-[36px]',
    md: 'px-6 py-2.5 text-sm min-h-[44px]',
    lg: 'px-8 py-3 text-base min-h-[52px]',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="spinner mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
          处理中...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
