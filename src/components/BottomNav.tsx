'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Building2, CalendarCheck, User } from 'lucide-react';

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/host', icon: Building2, label: 'Host' },
  { href: '/bookings', icon: CalendarCheck, label: 'Bookings' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="flex h-16">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[48px]"
            >
              <Icon
                className={`w-5 h-5 ${
                  active ? 'text-[#1A4A8A]' : 'text-gray-400'
                }`}
                fill={active ? '#1A4A8A' : 'none'}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span
                className={`text-[10px] font-medium ${
                  active ? 'text-[#1A4A8A]' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
