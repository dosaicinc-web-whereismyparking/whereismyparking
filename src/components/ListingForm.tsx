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
    const isStepValid = await trigger(['name', 'address']);
    if (!isStepValid) return;
    setStep(2);
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
    <div className="max-w-2xl mx-auto px-4">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-12 px-2">
        {[1, 2, 3, 4].map(s => (
          <React.Fragment key={s}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? 'bg-primary text-white shadow-md' : 'bg-surface border border-border text-text-secondary'
            }`}>
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 4 && <div className={`flex-1 h-[2px] mx-3 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-surface rounded-airbnb-lg shadow-airbnb border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-12">
          
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-semibold">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-text-main">Property Details</h3>
                <p className="text-sm text-text-secondary mt-1">Tell us the basics about your parking space.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-widest">Listing Name</label>
                  <input 
                    id="name"
                    {...register('name')}
                    placeholder="e.g. Skyline Residency Visitor Parking"
                    className="w-full px-4 py-4 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-300"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-2 font-semibold">{errors.name.message}</p>}
                </div>

                <div>
                  <label htmlFor="address" className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-widest">Physical Address</label>
                  <textarea 
                    id="address"
                    {...register('address')}
                    rows={3}
                    placeholder="Provide the exact location including landmarks..."
                    className="w-full px-4 py-4 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-gray-300 resize-none"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-2 font-semibold">{errors.address.message}</p>}
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="button" 
                  onClick={handleStep1Next}
                  className="w-full bg-text-main text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-sm"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Map Location */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-text-main">Set precise location</h3>
                <p className="text-sm text-text-secondary mt-1">Drag the map to place the pin exactly where your spot is.</p>
              </div>

              <div className="h-96 rounded-2xl overflow-hidden border border-border relative group">
                <ParkingMap 
                  initialViewState={{ latitude: lat, longitude: lng, zoom: 16 }}
                  onMove={onMapMove}
                  parkingData={[]}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl transform -translate-y-6 animate-bounce">
                    <MapPin className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50/50 border border-border p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Latitude</p>
                  <p className="text-sm font-mono font-bold text-text-main mt-1">{lat.toFixed(6)}</p>
                </div>
                <div className="bg-gray-50/50 border border-border p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Longitude</p>
                  <p className="text-sm font-mono font-bold text-text-main mt-1">{lng.toFixed(6)}</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(1)} className="flex-1 text-text-main border border-border py-4 rounded-xl font-bold hover:bg-gray-50 transition-all">Back</button>
                <button 
                  type="button" 
                  onClick={() => setStep(3)}
                  className="flex-[2] bg-text-main text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-sm"
                >
                  Review Details
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Features */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-text-main">Property Config</h3>
                <p className="text-sm text-text-secondary mt-1">Select the type and coverage of your parking space.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Parking Hub Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['PRIVATE', 'PUBLIC'].map(t => (
                      <button 
                        key={t}
                        type="button"
                        onClick={() => setValue('type', t as any)}
                        className={`py-8 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          watch('type') === t ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-text-main'
                        }`}
                      >
                        <span className="font-bold text-base tracking-tight">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Space Coverage</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['OPEN', 'COVERED', 'MULTI'].map(c => (
                      <button 
                        key={c}
                        type="button"
                        onClick={() => setValue('coverage', c as any)}
                        className={`py-5 rounded-xl border-2 transition-all text-xs font-bold uppercase tracking-widest ${
                          watch('coverage') === c ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-text-main'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setStep(2)} className="flex-1 text-text-main border border-border py-4 rounded-xl font-bold hover:bg-gray-50 transition-all">Back</button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-primary text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm & Subscribe'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-text-main">One last step</h3>
                <p className="text-sm text-text-secondary mt-1">Activate your listing to start appearing on the map.</p>
              </div>

              <div className="bg-primary rounded-[32px] p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-primary/20">
                <div className="relative z-10">
                  <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-widest mb-6">Partner Plan</div>
                  <h4 className="text-3xl font-bold mb-2">Standard Listing</h4>
                  <div className="flex items-baseline gap-1 mb-10">
                    <span className="text-5xl font-bold">₹499</span>
                    <span className="text-white/60 text-sm font-medium">/ per month</span>
                  </div>
                  
                  <div className="space-y-4 mb-10">
                    {[
                      "Priority Map Visibility",
                      "Standard Business Analytics",
                      "Direct Driver Navigation",
                      "Verified Listing Badge"
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm font-semibold">
                        <Check className="w-5 h-5 text-white" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <a 
                    href={upiUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-white text-primary py-4 rounded-2xl font-bold text-center hover:bg-gray-50 transition-all active:scale-[0.98] shadow-lg shadow-black/10"
                  >
                    Pay via UPI (GPay/PhonePe)
                  </a>
                </div>
                {/* Decorative background element */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              </div>

              <div className="space-y-4 pt-4">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest">Transaction Reference (UTR)</label>
                <input 
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.toUpperCase())}
                  placeholder="Enter 12-digit UTR Code"
                  maxLength={12}
                  className="w-full px-4 py-5 rounded-2xl border-2 border-border focus:border-primary font-mono text-center text-2xl tracking-[0.4em] outline-none transition-all placeholder:text-gray-200"
                />
              </div>

              <button 
                type="button" 
                onClick={handleUtrSubmit}
                disabled={loading || utr.length < 12}
                className="w-full bg-text-main text-white py-4 rounded-2xl font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-50 shadow-md"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Submit for Verification'}
              </button>
            </div>
          )}

          {/* Success Step */}
          {step === 5 && (
            <div className="py-12 text-center space-y-8 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
                <Check className="w-12 h-12 stroke-[3]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-text-main">Request Received!</h3>
                <p className="text-text-secondary max-w-sm mx-auto leading-relaxed">Your listing and UTR verification are being processed. Activation usually takes less than 24 hours.</p>
              </div>
              <div className="pt-8">
                <Link 
                  href="/dashboard" 
                  className="inline-block bg-primary text-white px-10 py-4 rounded-xl font-bold hover:bg-primary-hover transition-all active:scale-95 shadow-md shadow-primary/20"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
