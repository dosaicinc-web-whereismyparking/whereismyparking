'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  MapPin, 
  Info, 
  Settings, 
  CreditCard, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ParkingMap } from '@/components/Map';
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  type: z.enum(['PUBLIC', 'PRIVATE']),
  coverage: z.enum(['OPEN', 'COVERED', 'MULTI']),
  latitude: z.number(),
  longitude: z.number(),
});

type FormData = z.infer<typeof formSchema>;

export function ListingForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [upiUrl, setUpiUrl] = useState<string | null>(null);
  const [utr, setUtr] = useState('');

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'PRIVATE',
      coverage: 'OPEN',
      latitude: 10.012, // Default to Kochi area
      longitude: 76.328,
    }
  });

  const lat = watch('latitude');
  const lng = watch('longitude');

  const handleStep1Next = async () => {
    const valid = await trigger(['name', 'address']);
    if (valid) setStep(2);
  };

  const onMapMove = (viewState: any) => {
    setValue('latitude', viewState.latitude);
    setValue('longitude', viewState.longitude);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // 1. Create Listing
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create listing');
      
      setListingId(resData.id);

      // 2. Initiate Subscription
      const subRes = await fetch('/api/subscriptions/initiate', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ listingId: resData.id })
      });

      const subData = await subRes.json();
      if (!subRes.ok) throw new Error(subData.error || 'Failed to initiate subscription');

      setUpiUrl(subData.upiUrl);
      setStep(4); // Move to payment step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUtrSubmit = async () => {
    if (!utr || utr.length < 12) {
        setError('Please enter a valid 12-digit UTR code');
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/subscriptions/submit-utr', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ subscriptionId: listingId, utr }) // subscription record id is linked to listingId in this mvp
      });
      
      if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to submit UTR');
      }

      setStep(5); // Success step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-10 px-4">
        {[1, 2, 3, 4].map(s => (
          <React.Fragment key={s}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-2 border-gray-200 text-gray-400'
            }`}>
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 4 && <div className={`flex-1 h-0.5 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200 border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
                  <p className="text-sm text-gray-500">Tell us about your parking space.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Listing Name</label>
                <input 
                  {...register('name')}
                  placeholder="e.g. Skyline Residency Visitor Parking"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Physical Address</label>
                <textarea 
                  {...register('address')}
                  rows={3}
                  placeholder="Detailed address including landmarks..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none"
                />
                {errors.address && <p className="text-red-500 text-xs mt-1 font-medium">{errors.address.message}</p>}
              </div>

              <div className="pt-4">
                <button 
                  type="button" 
                  onClick={handleStep1Next}
                  className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
                >
                  Continue to Map
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Map Location */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Set Location</h3>
                  <p className="text-sm text-gray-500">Drag the map to place the pin on your parking spot.</p>
                </div>
              </div>

              <div className="h-80 rounded-2xl overflow-hidden border border-gray-200 relative">
                <ParkingMap 
                  initialViewState={{ latitude: lat, longitude: lng, zoom: 16 }}
                  onMove={onMapMove}
                  parkingData={[]}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-300 transform -translate-y-5">
                    <MapPin className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Latitude</p>
                  <p className="text-sm font-mono font-bold text-gray-700">{lat.toFixed(6)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Longitude</p>
                  <p className="text-sm font-mono font-bold text-gray-700">{lng.toFixed(6)}</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all">Back</button>
                <button 
                  type="button" 
                  onClick={() => setStep(3)}
                  className="flex-2 bg-gray-900 text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
                >
                  Continue to Features
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Features */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Spot Features</h3>
                  <p className="text-sm text-gray-500">Describe the access and coverage of your spot.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Parking Type</label>
                <div className="grid grid-cols-2 gap-4">
                  {['PRIVATE', 'PUBLIC'].map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => setValue('type', t as any)}
                      className={`py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                        watch('type') === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      <span className="font-bold">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Coverage</label>
                <div className="grid grid-cols-3 gap-3">
                  {['OPEN', 'COVERED', 'MULTI'].map(c => (
                    <button 
                      key={c}
                      type="button"
                      onClick={() => setValue('coverage', c as any)}
                      className={`py-4 rounded-xl border-2 transition-all text-sm font-black ${
                        watch('coverage') === c ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all">Back</button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-2 bg-blue-600 text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Review & Submit'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Subscription</h3>
                  <p className="text-sm text-gray-500">Choose a plan to list your parking spot.</p>
                </div>
              </div>

              <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="relative z-10">
                  <h4 className="text-indigo-200 font-black uppercase text-xs tracking-[0.2em] mb-4">Silver Monthly Pass</h4>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-black">₹499</span>
                    <span className="text-indigo-300 text-sm">/ month</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm font-medium">
                      <Check className="w-4 h-4 text-emerald-400" /> Professional Listing Page
                    </li>
                    <li className="flex items-center gap-2 text-sm font-medium">
                      <Check className="w-4 h-4 text-emerald-400" /> High Visibility on Map
                    </li>
                    <li className="flex items-center gap-2 text-sm font-medium">
                      <Check className="w-4 h-4 text-emerald-400" /> Verified Owner Badge
                    </li>
                  </ul>

                  <a 
                    href={upiUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-white text-indigo-900 py-4 rounded-2xl font-black text-center hover:bg-indigo-50 transition-all active:scale-95 shadow-xl shadow-indigo-950/20"
                  >
                    PAY VIA UPI
                  </a>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
              </div>

              <div className="pt-4">
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Enter UTR Code (Transaction Ref)</label>
                <input 
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.toUpperCase())}
                  placeholder="12-digit UPI Transaction ID"
                  maxLength={12}
                  className="w-full px-4 py-4 rounded-2xl border-2 border-dashed border-gray-200 font-mono text-center text-xl tracking-[0.3em] outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <button 
                type="button" 
                onClick={handleUtrSubmit}
                disabled={loading || utr.length < 12}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-100"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'CONFIRM PAYMENT'}
              </button>
            </div>
          )}

          {/* Success Step */}
          {step === 5 && (
            <div className="py-10 text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-xl shadow-emerald-50">
                <Check className="w-12 h-12 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-gray-900">We've got it!</h3>
                <p className="text-gray-500 mt-2 max-w-sm mx-auto">Your listing and payment reference have been submitted. Our team will verify the transaction and activate your spot within 24 hours.</p>
              </div>
              <div className="pt-6">
                <Link 
                  href="/dashboard" 
                  className="inline-block bg-gray-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-gray-800 transition-all active:scale-95"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

import Link from 'next/link';
