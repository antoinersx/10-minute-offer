'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OnboardingModalProps {
  userId: string
  onComplete: () => void
}

export default function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    business_name: '',
    business_description: '',
    target_avatar: '',
    price_range: '',
    competitors: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          onboarding_complete: true,
        })
        .eq('id', userId)

      if (error) throw error

      onComplete()
    } catch (error) {
      console.error('Error saving onboarding data:', error)
      alert('Failed to save onboarding data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_complete: true })
        .eq('id', userId)

      if (error) throw error

      onComplete()
    } catch (error) {
      console.error('Error skipping onboarding:', error)
      alert('Failed to skip onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Welcome to MarketReveal!</h2>
            <p className="text-gray-600">
              Let's gather some information about your business to help us create better market research for you.
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Step {step} of 3</span>
              <button
                onClick={handleSkip}
                disabled={loading}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Skip for now
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Basic Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => handleChange('business_name', e.target.value)}
                  placeholder="e.g., Acme Consulting"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you sell or offer?
                  <span className="text-gray-500 font-normal ml-1">(1-2 sentences)</span>
                </label>
                <textarea
                  value={formData.business_description}
                  onChange={(e) => handleChange('business_description', e.target.value)}
                  placeholder="e.g., We help B2B SaaS companies generate qualified leads through LinkedIn outreach and content marketing."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Target Customer */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who is your target customer?
                  <span className="text-gray-500 font-normal ml-1">(2-3 sentences)</span>
                </label>
                <textarea
                  value={formData.target_avatar}
                  onChange={(e) => handleChange('target_avatar', e.target.value)}
                  placeholder="e.g., CEOs and founders of early-stage B2B SaaS companies (1-20 employees) who are struggling to generate consistent leads and are willing to invest in proven marketing strategies."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What price range are you targeting?
                </label>
                <select
                  value={formData.price_range}
                  onChange={(e) => handleChange('price_range', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a range...</option>
                  <option value="under-100">Under $100</option>
                  <option value="100-500">$100 - $500</option>
                  <option value="500-2000">$500 - $2,000</option>
                  <option value="2000-plus">$2,000+</option>
                </select>
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Competitors */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any competitors you know of?
                  <span className="text-gray-500 font-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  value={formData.competitors}
                  onChange={(e) => handleChange('competitors', e.target.value)}
                  placeholder="e.g., Company A, Company B, etc."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-2">
                  This helps us understand your market better and position your offer effectively.
                </p>
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
