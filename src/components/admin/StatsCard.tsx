import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'default' | 'pending' | 'active' | 'warning' | 'rejected';
  description?: string;
}

const toneClasses = {
  default: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-orange-100 text-orange-800',
  rejected: 'bg-red-100 text-red-700',
};

export function StatsCard({ label, value, icon: Icon, tone = 'default', description }: StatsCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
        </div>
        <div className={`rounded-2xl p-3 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}
