'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface PublicParkingModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (data: any) => Promise<void>;
  submitting?: boolean;
}

export function PublicParkingModal({
  open,
  onCancel,
  onConfirm,
  submitting = false,
}: PublicParkingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 12.9716, // Default to Bengaluru for MVP
    longitude: 77.5946,
    type: 'PUBLIC',
    coverage: 'OPEN',
    vehicleTypes: ['CAR', 'BIKE'],
    notes: '',
  });

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#1A4A8A]">Public Data Entry</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Add public parking</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 hover:bg-slate-100"
          >
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-6 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-sm font-bold text-slate-700">Parking Name</span>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. MG Road Public Parking"
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-bold text-slate-700">Full Address</span>
            <input
              required
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter complete address"
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
            />
          </label>

          <label>
            <span className="text-sm font-bold text-slate-700">Latitude</span>
            <input
              required
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
            />
          </label>

          <label>
            <span className="text-sm font-bold text-slate-700">Longitude</span>
            <input
              required
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
            />
          </label>

          <label>
            <span className="text-sm font-bold text-slate-700">Type</span>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-bold text-slate-700">Coverage</span>
            <select
              value={formData.coverage}
              onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
            >
              <option value="OPEN">Open air</option>
              <option value="COVERED">Covered</option>
              <option value="MULTI">Multi-level</option>
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-bold text-slate-700">Notes (Instructions, hours, etc.)</span>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="e.g. Free after 8 PM, No cameras"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
            />
          </label>

          <div className="mt-4 flex flex-wrap justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-12 rounded-2xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-12 rounded-2xl bg-[#1A4A8A] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 disabled:bg-slate-300"
            >
              {submitting ? 'Creating record...' : 'Create parking record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
