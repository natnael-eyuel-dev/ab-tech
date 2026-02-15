'use client'

import { useState } from 'react'
import { OTPRequestForm } from './otp-request-form'
import { OTPVerifyForm } from './otp-verify-form'
import { signIn } from 'next-auth/react'

interface OTPAuthFlowProps {
  onSuccess?: () => void
}

export function OTPAuthFlow({ onSuccess }: OTPAuthFlowProps) {
  const [currentStep, setCurrentStep] = useState<'request' | 'verify'>('request')
  const [email, setEmail] = useState('')

  const handleOTPRequestSuccess = (userEmail: string) => {
    setEmail(userEmail)
    setCurrentStep('verify')
  }

  const handleOTPVerifySuccess = async (payload: { user: any; loginToken: string }) => {
    try {
      const result = await signIn('credentials', {
        email: payload.user.email,
        password: 'otp-auth',
        otpLoginToken: payload.loginToken,
        redirect: false,
      })

      if (result?.error) {
        console.error('OTP sign-in failed:', result.error)
        localStorage.setItem('user', JSON.stringify(payload.user))
      }

      onSuccess?.()
      window.location.reload()
    } catch (error) {
      console.error('Error during OTP login:', error)
      // Fallback: store user data in localStorage or state
      localStorage.setItem('user', JSON.stringify(payload.user))
      onSuccess?.()
      window.location.reload()
    }
  }

  const handleBack = () => {
    setCurrentStep('request')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {currentStep === 'request' ? (
        <OTPRequestForm onSuccess={handleOTPRequestSuccess} />
      ) : (
        <OTPVerifyForm 
          email={email} 
          onBack={handleBack}
          onSuccess={handleOTPVerifySuccess}
        />
      )}
    </div>
  )
}