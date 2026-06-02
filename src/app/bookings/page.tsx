'use client';
import { CalendarCheck } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

export default function BookingsPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F7F8FA] pb-[calc(64px+env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-[24px] font-bold text-gray-900">My Bookings</h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Manage your parking reservations
        </p>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center h-[calc(100dvh-200px)]">
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarCheck className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-2">
            Coming Soon
          </h2>
          <p className="text-[14px] text-gray-500">
            Booking management is coming in the next update.
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
