'use client';
import { useState, useEffect } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('whereismyparking_demo_user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#F7F8FA] pb-[calc(64px+env(safe-area-inset-bottom,0px))] flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-[#F7F8FA] pb-[calc(64px+env(safe-area-inset-bottom,0px))]">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <h1 className="text-[24px] font-bold text-gray-900">Profile</h1>
        </div>

        {/* Content */}
        <div className="flex items-center justify-center h-[calc(100dvh-200px)]">
          <div className="text-center px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-[20px] font-bold text-gray-900 mb-2">
              Sign In to Continue
            </h2>
            <p className="text-[14px] text-gray-500 mb-6">
              Create or sign in to your account to access your profile
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-[#1A4A8A] text-white font-semibold py-3 rounded-xl"
            >
              Go to Home
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F7F8FA] pb-[calc(64px+env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-[24px] font-bold text-gray-900">Profile</h1>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user.email?.charAt(0).toUpperCase() ||
                user.phone?.slice(-1).toUpperCase()}
            </div>
            <div>
              <p className="text-[14px] text-gray-500">Email</p>
              <p className="font-bold text-gray-900">{user.email || 'Not set'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
