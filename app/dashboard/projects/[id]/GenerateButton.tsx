'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UpgradeButton from '../../UpgradeButton'

interface GenerationLimit {
  allowed: number
  used: number
  remaining: number
  isUnlimited: boolean
}

interface GenerateButtonProps {
  projectId: string
  status: string
  limits: GenerationLimit | null
  plan: string
}

export default function GenerateButton({ projectId, status, limits, plan }: GenerateButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleGenerate = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/generate-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start generation')
      }

      setLoading(false)

      // Refresh the page to show generating status
      router.refresh()

      // Start polling for updates
      const pollInterval = setInterval(() => {
        router.refresh()
      }, 3000)

      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generation')
      setLoading(false)
    }
  }

  const canGenerate = status === 'draft' || status === 'failed' || status === 'partial'
  const isGenerating = status === 'generating'
  const hasLimitRemaining = limits ? limits.remaining > 0 : false
  const limitReached = limits ? limits.remaining === 0 : false

  return (
    <div className="text-right">
      {error && (
        <div className="mb-2 text-sm text-red-600">{error}</div>
      )}
      {limitReached && canGenerate && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">
            {plan === 'free'
              ? "You've used your free offer. Upgrade to Pro for 5 offers per month."
              : 'Monthly generation limit reached. Your limit will reset on your billing cycle date.'}
          </p>
          {plan !== 'pro' && (
            <UpgradeButton className="text-sm" />
          )}
        </div>
      )}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || loading || limitReached}
        className={`px-8 py-3 rounded-lg font-semibold transition-opacity ${canGenerate && !loading && hasLimitRemaining
            ? 'bg-accent text-white hover:opacity-90'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
      >
        {isGenerating
          ? 'Generating...'
          : loading
            ? 'Starting...'
            : status === 'complete'
              ? 'Generated ✓'
              : limitReached
                ? 'Limit Reached'
                : 'Generate Offer'}
      </button>
      {isGenerating && (
        <p className="text-sm text-gray-600 mt-2">
          This may take a few minutes. The page will auto-refresh.
        </p>
      )}
    </div>
  )
}
