import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <Link href="/" className={`flex items-center gap-2 font-extrabold tracking-tight select-none ${className}`}>
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black">
        N
      </span>
      <span className={`${sizeClasses[size]} bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500`}>
        NovaMind
      </span>
    </Link>
  );
}
