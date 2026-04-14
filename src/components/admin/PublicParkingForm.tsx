'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(3).max(100),
  address: z.string().min(10).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  type: z.literal('PUBLIC'),
  coverage: z.enum(['OPEN', 'COVERED', 'MULTI']),
  availableHours: z.string(),
  vehicleTypes: z.array(z.enum(['Car', 'Bike', 'Truck'])).min(1),
});

type FormData = z.infer<typeof formSchema>;

interface PublicParkingFormProps {
  onSuccess?: () => void;
}

export function PublicParkingForm({ onSuccess }: PublicParkingFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'PUBLIC',
      vehicleTypes: [],
    },
  });

  const vehicleTypes = watch('vehicleTypes');

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/public-parking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setToast('Public parking record created successfully');
        onSuccess?.();
      } else {
        setToast(result.error || 'Failed to create record');
      }
    } catch (error) {
      setToast('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVehicleTypeChange = (type: 'Car' | 'Bike' | 'Truck', checked: boolean) => {
    const current = vehicleTypes || [];
    if (checked) {
      setValue('vehicleTypes', [...current, type]);
    } else {
      setValue('vehicleTypes', current.filter(t => t !== type));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {toast && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {toast}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-slate-700">Parking Name</label>
        <input
          {...register('name')}
          type="text"
          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
          placeholder="e.g. MG Road Public Parking"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700">Address</label>
        <input
          {...register('address')}
          type="text"
          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
          placeholder="Enter complete address"
        />
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700">Latitude</label>
          <input
            {...register('latitude', { valueAsNumber: true })}
            type="number"
            step="any"
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
          />
          {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700">Longitude</label>
          <input
            {...register('longitude', { valueAsNumber: true })}
            type="number"
            step="any"
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
          />
          {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700">Type</label>
        <select
          {...register('type')}
          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
        >
          <option value="PUBLIC">Public</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700">Coverage</label>
        <select
          {...register('coverage')}
          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
        >
          <option value="OPEN">Open</option>
          <option value="COVERED">Covered</option>
          <option value="MULTI">Multi-level</option>
        </select>
        {errors.coverage && <p className="mt-1 text-sm text-red-600">{errors.coverage.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700">Operating Hours</label>
        <textarea
          {...register('availableHours')}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
          placeholder="e.g. 24/7, 8 AM - 10 PM"
        />
        {errors.availableHours && <p className="mt-1 text-sm text-red-600">{errors.availableHours.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700">Vehicle Types</label>
        <div className="mt-2 space-y-2">
          {(['Car', 'Bike', 'Truck'] as const).map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={vehicleTypes?.includes(type) || false}
                onChange={(e) => handleVehicleTypeChange(type, e.target.checked)}
                className="mr-2"
              />
              {type}
            </label>
          ))}
        </div>
        {errors.vehicleTypes && <p className="mt-1 text-sm text-red-600">{errors.vehicleTypes.message}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="min-h-12 w-full rounded-2xl bg-[#1A4A8A] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 disabled:bg-slate-300"
      >
        {submitting ? 'Creating...' : 'Create Public Parking Record'}
      </button>
    </form>
  );
}