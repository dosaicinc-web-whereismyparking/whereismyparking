'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone } from 'lucide-react';
import Link from 'next/link';

export default function OwnerLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Mock OTP sending
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    // Mock OTP verification
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <main className="min-h-[100dvh] bg-white flex flex-col">
      <div className="sticky top-0 bg-white z-40 px-4 py-3 flex items-center">
        <Link href="/host" className="p-1 min-h-[48px] min-w-[48px] flex items-center justify-center -ml-2">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-6 pb-8">
        <h1 className="text-[28px] font-extrabold text-gray-900 leading-tight mb-2">
          {step === 'phone' ? 'Log in or sign up' : 'Enter OTP'}
        </h1>
        <p className="text-[15px] text-gray-500 mb-8">
          {step === 'phone' 
            ? 'We will text you a code to verify your number.'
            : `We sent a 6-digit code to +91 ${phone}`
          }
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-[14px] p-3 rounded-[12px] mb-6">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] py-4 pl-14 pr-4 text-[16px] text-gray-900 font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Enter 10 digits"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full bg-primary text-white font-bold text-[16px] py-4 rounded-[14px] hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? 'Sending...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">
                6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-gray-50 border border-gray-200 rounded-[14px] py-4 px-4 text-[24px] text-center tracking-[0.5em] text-gray-900 font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="------"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-primary text-white font-bold text-[16px] py-4 rounded-[14px] hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? 'Verifying...' : 'Verify & Log In'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); }}
              className="w-full text-primary font-semibold text-[15px] py-2"
            >
              Change mobile number
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
