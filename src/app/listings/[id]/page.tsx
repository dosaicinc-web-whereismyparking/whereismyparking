import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ListingPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  try {
    const { data: listing } = await supabase
      .from('parking_listings')
      .select('name, address, type')
      .eq('id', params.id)
      .single();

    if (!listing) {
      return {
        title: 'Parking Not Found - WhereIsMyParking',
      };
    }

    const title = `${listing.name} Parking - WhereIsMyParking`;
    const description = `Parking at ${listing.address}, ${listing.type.toLowerCase()} parking space available.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    };
  } catch (error) {
    return {
      title: 'Parking Details - WhereIsMyParking',
    };
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  try {
    const { data: listing } = await supabase
      .from('parking_listings')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!listing) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-srd-blue hover:text-srd-blue/80 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-black text-srd-blue mb-4">{listing.name}</h1>
            <p className="text-gray-600 mb-6">{listing.address}</p>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Details</h2>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="text-sm text-gray-900">{listing.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Coverage</dt>
                    <dd className="text-sm text-gray-900">{listing.coverage}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">{listing.status}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>
                <div className="text-sm text-gray-600">
                  <p>Latitude: {listing.latitude.toFixed(6)}</p>
                  <p>Longitude: {listing.longitude.toFixed(6)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}