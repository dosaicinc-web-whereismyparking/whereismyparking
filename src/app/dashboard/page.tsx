'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  MapPin, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ChevronRight,
  Loader2,
  Settings,
  LogOut,
  Wallet,
  LayoutDashboard,
  Map as MapIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ParkingListing, SubscriptionStatus } from '@/lib/supabase-types';

type DashboardListing = ParkingListing & {
  subscription?: {
    status: SubscriptionStatus;
    utr?: string;
    endDate?: string;
  }
};

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      let currentUser = session?.user;
      let token = session?.access_token;

      if (!currentUser && process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true') {
        const demoUserData = localStorage.getItem('whereismyparking_demo_user');
        if (demoUserData) {
          currentUser = JSON.parse(demoUserData);
          token = 'demo-token';
        }
      }

      if (!currentUser) {
        window.location.href = '/';
        return;
      }
      
      setUser(currentUser);
      fetchListings(token || '');
    }
    getSession();
  }, []);

  async function fetchListings(token: string) {
    try {
      const res = await fetch('/api/listings/owner', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data = await res.json();
      setListings(data.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string, subStatus?: SubscriptionStatus) => {
    if (subStatus === 'PENDING_VERIFICATION') {
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <Clock className="w-3 h-3" />
            Verification Pending
          </span>
        );
    }
    
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case 'PENDING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-primary border border-primary/10">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-text-secondary border border-gray-100">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-text-secondary text-sm font-medium">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar - Airbnb Internal Style */}
      <aside className="w-full md:w-72 bg-surface md:border-r border-border flex flex-col z-30">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                 <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            <span className="text-xl font-bold tracking-tight text-text-main group-hover:text-primary transition-colors">WhereIsMyParking</span>
          </Link>
          <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-1">Owner Partner</p>
            <p className="text-xs text-text-secondary line-clamp-1">{user?.phone}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl bg-primary/10 text-primary transition-all">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard Overview
          </Link>
          <Link href="/dashboard/listings" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-text-secondary hover:bg-gray-50 transition-all">
            <MapIcon className="w-4 h-4" />
            My Parking Spots
          </Link>
          <Link href="/dashboard/payments" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-text-secondary hover:bg-gray-50 transition-all">
            <Wallet className="w-4 h-4" />
            Earnings & Subscriptions
          </Link>
        </nav>

        <div className="p-6 border-t border-border mt-auto">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-main tracking-tight">Your Dashboard</h2>
            <p className="text-text-secondary mt-2 text-lg">Manage your property performance and space details.</p>
          </div>
          <Link 
            href="/dashboard/new" 
            className="flex items-center justify-center gap-2 bg-text-main hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold shadow-sm transition-all active:scale-95 text-sm"
          >
            <Plus className="w-5 h-5" />
            Add New Space
          </Link>
        </header>

        {/* Stats Grid - Premium Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-surface p-6 rounded-airbnb border border-border shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Total Listings</p>
            <p className="text-4xl font-bold text-text-main">{listings.length}</p>
          </div>
          <div className="bg-surface p-6 rounded-airbnb border border-border shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Live & Active</p>
            <p className="text-4xl font-bold text-primary">{listings.filter(l => l.status === 'ACTIVE').length}</p>
          </div>
          <div className="bg-surface p-6 rounded-airbnb border border-border shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Pending Action</p>
            <p className="text-4xl font-bold text-amber-500">{listings.filter(l => l.status === 'PENDING').length}</p>
          </div>
          <div className="bg-surface p-6 rounded-airbnb border border-border shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Active Subs</p>
            <p className="text-4xl font-bold text-emerald-500">{listings.filter(l => l.subscription?.status === 'ACTIVE').length}</p>
          </div>
        </div>

        {/* Listings Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-text-main">Listed Locations</h3>
            <Link href="/dashboard/listings" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              Management Portal <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="bg-surface border border-border border-dashed rounded-[32px] p-20 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-gray-200" />
              </div>
              <h4 className="text-xl font-bold text-text-main mb-2">No active listings</h4>
              <p className="text-text-secondary max-w-sm mb-8">Start hosting today to reach thousands of drivers looking for secure parking.</p>
              <Link 
                href="/dashboard/new" 
                className="bg-primary hover:bg-primary-hover text-white px-10 py-4 rounded-xl font-bold shadow-md transition-all active:scale-95"
              >
                Create Listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map(listing => (
                <div key={listing.id} className="bg-surface p-6 rounded-airbnb border border-border shadow-sm hover:shadow-airbnb transition-all flex flex-col gap-4 group">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    {getStatusBadge(listing.status, listing.subscription?.status)}
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-bold text-text-main truncate mb-1">{listing.name}</h4>
                    <p className="text-sm text-text-secondary line-clamp-2 min-h-[40px] leading-relaxed">{listing.address}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                      <span>{listing.type}</span>
                      <span className="w-1 h-1 bg-border rounded-full"></span>
                      <span>{listing.coverage}</span>
                    </div>
                    <Link href={`/dashboard/listings/${listing.id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
