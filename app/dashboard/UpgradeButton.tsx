'use client';

import { useState } from 'react';

interface UpgradeButtonProps {
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function UpgradeButton({ variant = 'primary', className = '' }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start upgrade process. Please try again.');
      setIsLoading(false);
    }
  };

  const baseStyles = 'px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyles = variant === 'primary'
    ? 'bg-accent text-white hover:bg-accent/90'
    : 'bg-gray-100 text-gray-800 hover:bg-gray-200';

  return (
    <button
      onClick={handleUpgrade}
      disabled={isLoading}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {isLoading ? 'Processing...' : 'Upgrade to Pro'}
    </button>
  );
}
