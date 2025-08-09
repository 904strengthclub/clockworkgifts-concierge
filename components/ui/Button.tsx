'use client';

import Link from 'next/link';
import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function Button({
  href,
  children,
  variant = 'solid',
  size = 'md',
  className = '',
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg font-semibold transition-colors ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    solid:  'bg-black text-white hover:bg-[#111] active:bg-[#0a0a0a] focus-visible:ring-black/50',
    outline:'border border-gray-300 text-gray-900 bg-white hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400',
    soft:   'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-300',
  };

  const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }
  return <button className={classes} {...rest}>{children}</button>;
}

export default Button;
