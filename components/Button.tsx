// /components/Button.tsx
'use client';

import Link from 'next/link';
import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  children: React.ReactNode;
};

export default function Button({ href, children, className = '', ...rest }: Props) {
  const base =
    'inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold ' +
    'bg-black text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed';
  if (href) {
    return (
      <Link href={href} className={`${base} ${className}`}>
        {children}
      </Link>
    );
  }
  return (
    <button className={`${base} ${className}`} {...rest}>
      {children}
    </button>
  );
}
