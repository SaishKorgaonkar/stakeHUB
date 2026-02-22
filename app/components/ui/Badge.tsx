import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant: 'open' | 'locked' | 'resolved' | 'cancelled';
  className?: string;
}

export function Badge({ children, variant, className = '' }: BadgeProps) {
  const variants = {
    open: 'bg-lime text-black',
    locked: 'bg-yellow text-black',
    resolved: 'bg-coral text-white',
    cancelled: 'bg-gray-300 text-black',
  };

  return (
    <span
      className={`
        inline-block px-3 py-1 text-sm font-bold uppercase
        border-2 border-black brutal-shadow-sm
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
