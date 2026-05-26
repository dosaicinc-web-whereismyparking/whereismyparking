'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')

      setStep('otp')
      setMessage('OTP sent successfully to your mobile number.')
      
      if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true') {
        setOtp('000000');
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid OTP')

      // Use the session issued by our custom auth route
      const { error: signInError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (signInError) throw signInError;
      
      // Redirect based on role
      if (data.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      onClose();
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 transition-all animate-in fade-in duration-300">
      <div className="bg-surface w-full max-w-[568px] rounded-airbnb-lg shadow-airbnb overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Modal Header */}
        <div className="relative border-b border-border py-4 flex items-center justify-center">
            <button 
              onClick={onClose}
              className="absolute left-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-text-main" />
            </button>
            <h2 className="text-base font-bold text-text-main">
              Log in or sign up
            </h2>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-text-main mb-2">
              {step === 'phone' ? 'Welcome to WhereIsMyParking' : 'Verify your number'}
            </h3>
            <p className="text-text-secondary">
              {step === 'phone' 
                ? 'Discover and list parking spaces across urban India.' 
                : `Enter the code we sent to ${phone}`}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-red-600" />
              {error}
            </div>
          )}

          {message && !error && (
            <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-xl text-primary text-sm">
              {message}
            </div>
          )}

          <form onSubmit={step === 'phone' ? handleSendOtp : handleVerifyOtp} className="space-y-6">
            {step === 'phone' ? (
              <div className="space-y-4">
                <div className="border border-text-secondary/30 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 transition-all">
                  <div className="p-3 border-b border-text-secondary/10 bg-gray-50/50">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                      Country/Region
                    </label>
                    <div className="text-sm font-medium mt-0.5">India (+91)</div>
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone.replace('+91', '')}
                    onChange={(e) => setPhone('+91' + e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-4 py-4 bg-transparent border-none text-lg tracking-wide focus:ring-0 placeholder:text-gray-300"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  We’ll call or text you to confirm your number. Standard message and data rates apply.
                </p>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-5 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary transition-all text-text-main text-3xl tracking-[0.5em] text-center font-bold placeholder:text-gray-100"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:bg-gray-200 text-white font-bold rounded-xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                step === 'phone' ? 'Continue' : 'Verify & Continue'
              )}
            </button>
          </form>

          {step === 'otp' && (
            <button
              onClick={() => setStep('phone')}
              className="w-full mt-6 text-sm font-semibold text-text-main underline hover:text-primary transition-colors"
            >
              Edit phone number
            </button>
          )}
        </div>
        
        <div className="px-8 pb-8 text-center">
            <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-[1px] bg-border" />
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">or</span>
                <div className="flex-1 h-[1px] bg-border" />
            </div>
            <p className="text-[12px] text-text-secondary">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
      </div>
    </div>
  )
}
