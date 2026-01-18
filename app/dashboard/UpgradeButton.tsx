'use client';

import { useState } from 'react';

interface UpgradeButtonProps {
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function UpgradeButton({ variant = 'primary', className = '' }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handlePurchase = async (planType: 'subscription' | 'one_report') => {
    setIsLoading(true);
    setShowOptions(false);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType }),
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
      alert('Failed to start purchase process. Please try again.');
      setIsLoading(false);
    }
  };

  const baseStyles = 'px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantStyles = variant === 'primary'
    ? 'bg-accent text-white hover:bg-accent/90'
    : 'bg-gray-100 text-gray-800 hover:bg-gray-200';

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isLoading}
        className={`${baseStyles} ${variantStyles} ${className}`}
      >
        {isLoading ? 'Processing...' : 'Get More Reports'}
      </button>

      {showOptions && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="font-semibold mb-3">Choose a plan</h3>

            <button
              onClick={() => handlePurchase('one_report')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-accent hover:bg-accent/5 mb-2 transition-colors"
            >
              <div className="font-medium">1 Report</div>
              <div className="text-sm text-gray-600">$14.99 one-time</div>
            </button>

            <button
              onClick={() => handlePurchase('subscription')}
              className="w-full text-left p-3 rounded-lg border-2 border-accent bg-accent/5 hover:bg-accent/10 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="font-medium">5 Reports/Month</div>
                <span className="text-xs bg-accent text-white px-2 py-1 rounded">Best Value</span>
              </div>
              <div className="text-sm text-gray-600">$29.99/month</div>
            </button>
          </div>
        </div>
      )}

      {showOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
}
