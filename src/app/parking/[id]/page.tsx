import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Building, Shield, Clock, Navigation } from 'lucide-react';

interface ListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const { data: listing } = await supabase
      .from('parking_listings')
      .select('name, address, type')
      .eq('id', id)
      .single();

    if (!listing) return { title: 'Not Found' };
    return { title: `${listing.name} - WhereIsMyParking` };
  } catch {
    return { title: 'WhereIsMyParking' };
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  try {
    const { id } = await params;
    const { data: listing } = await supabase
      .from('parking_listings')
      .select('*')
      .eq('id', id)
      .single();

    if (!listing) notFound();

    const coverageLabel =
      listing.coverage === 'COVERED' ? 'Covered'
      : listing.coverage === 'MULTI' ? 'Multi-level'
      : 'Open';

    return (
      <main className="min-h-[100dvh] bg-white pb-[calc(64px+env(safe-area-inset-bottom))] flex flex-col">
        <div className="sticky top-0 bg-white z-40 px-4 py-3 flex items-center">
          <Link href="/" className="p-1 min-h-[48px] min-w-[48px] flex items-center justify-center -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </Link>
        </div>

        <div className="px-6 pt-4 pb-8 flex-1">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-50 p-4 rounded-full">
              <MapPin className="w-12 h-12 text-primary" />
            </div>
          </div>

          <h1 className="text-[22px] font-bold text-gray-900 text-center leading-snug mb-2">
            {listing.name}
          </h1>
          <p className="text-[14px] text-gray-500 text-center mb-8">
            {listing.address}
          </p>

          <div className="h-[1px] bg-gray-100 w-full mb-8"></div>

          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-4">
              <Building className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-[15px] font-medium text-gray-900">
                  {listing.type === 'PUBLIC' ? 'Public Parking' : 'Private Space'}
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5">Parking type</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Shield className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-[15px] font-medium text-gray-900">{coverageLabel}</p>
                <p className="text-[13px] text-gray-500 mt-0.5">Coverage</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-[15px] font-medium text-gray-900">Check availability on arrival</p>
                <p className="text-[13px] text-gray-500 mt-0.5">Status</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 mt-auto safe-area-pb">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-accent hover:opacity-90 active:opacity-90 text-white font-semibold text-[16px] rounded-[14px] transition-colors min-h-[56px]"
          >
            <Navigation className="w-5 h-5" />
            Navigate with Google Maps
          </a>
        </div>
      </main>
    );
  } catch (error) {
    notFound();
  }
}