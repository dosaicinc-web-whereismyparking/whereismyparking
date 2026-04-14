'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PublicParkingForm } from '@/components/admin/PublicParkingForm';

export default function AddPublicParkingPage() {
  const router = useRouter();

  // TODO: Check admin session
  useEffect(() => {
    // Placeholder for admin auth check
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 md:px-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 rounded-[32px] bg-white p-8 shadow-sm">
          <div>
            <p className="text-sm font-bold text-[#1A4A8A]">Admin action</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Add Public Parking
            </h1>
            <p className="mt-4 text-base text-slate-600">
              Directly add public parking records to the database for areas not covered by owner submissions.
            </p>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <PublicParkingForm onSuccess={() => router.push('/admin')} />
        </section>
      </div>
    </main>
  );
}