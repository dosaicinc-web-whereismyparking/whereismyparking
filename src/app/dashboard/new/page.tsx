import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ListingForm } from '@/components/ListingForm';

export const metadata: Metadata = {
  title: 'Add New Parking | SOUP',
  description: 'List your parking space on the SOUP network.',
};

export default function NewListingPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white border-b border-gray-100 py-4 px-6 md:px-10 mb-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="text-xl font-black text-blue-700">SOUP</div>
          <div className="w-24"></div> {/* Spacer */}
        </div>
      </nav>

      <main className="px-4">
        <div className="max-w-2xl mx-auto mb-10 text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Onboard your spot</h1>
          <p className="text-gray-500 font-medium">Follow 4 easy steps to start earning from your parking space.</p>
        </div>

        <ListingForm />
      </main>
    </div>
  );
}
