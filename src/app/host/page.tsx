'use client';
import { Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export default function HostPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F7F8FA] pb-[calc(64px+env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-[24px] font-bold text-gray-900">List Your Space</h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Start earning from your parking space
        </p>
      </div>

      {/* Content */}
      <div className="px-4 py-8">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-8 text-center mb-8">
          <div className="w-16 h-16 bg-[#F97316] rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-[24px] font-bold text-gray-900 mb-2">
            Host Your Parking
          </h2>
          <p className="text-[14px] text-gray-600 mb-6">
            Turn your unused space into a revenue stream. It only takes a few
            minutes to get started.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center justify-center gap-2 bg-[#F97316] text-white font-semibold px-6 py-3 rounded-xl"
          >
            Create Listing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-1">Free to List</h3>
            <p className="text-[14px] text-gray-500">
              No upfront costs. We only take a commission when you earn.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-1">Instant Bookings</h3>
            <p className="text-[14px] text-gray-500">
              Get paid directly. Bookings are instant and secure.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-1">Support Included</h3>
            <p className="text-[14px] text-gray-500">
              Our team is here to help you succeed every step of the way.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
