import { ClipboardList, Download, LayoutDashboard, MapPinned, ShieldCheck, Users } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'listings', label: 'Listing Review', icon: ClipboardList },
  { id: 'payments', label: 'Payment Verification', icon: ShieldCheck },
  { id: 'publicParking', label: 'Public Parking', icon: MapPinned },
  { id: 'owners', label: 'Owners & Subscriptions', icon: Users },
  { id: 'exports', label: 'Exports', icon: Download },
];

export function AdminTabs({ activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`inline-flex min-h-12 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${
            activeTab === tab.id
              ? 'border-[#1A4A8A] bg-[#1A4A8A] text-white shadow-lg shadow-blue-100'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
          }`}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
