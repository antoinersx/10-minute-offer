'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingModal from './OnboardingModal'

interface OnboardingWrapperProps {
  userId: string
  showOnboarding: boolean
  profileData: any
}

export default function OnboardingWrapper({
  userId,
  showOnboarding,
  profileData,
}: OnboardingWrapperProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(showOnboarding)

  useEffect(() => {
    setIsOpen(showOnboarding)
  }, [showOnboarding])

  const handleComplete = () => {
    setIsOpen(false)
    router.refresh()
  }

  if (!isOpen) return null

  return <OnboardingModal userId={userId} onComplete={handleComplete} />
}
