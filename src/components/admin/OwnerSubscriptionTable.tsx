interface OwnerRow {
  id: string;
  phone: string;
  listingCount: number;
  activeListingCount: number;
  subscriptions: Array<{
    status: string;
    endDate?: string | null;
    gracePeriodEndsAt?: string | null;
  }>;
}

interface OwnerSubscriptionTableProps {
  rows: OwnerRow[];
  onLifecycleAction: (ownerId: string, action: 'ACTIVATE' | 'DEACTIVATE' | 'RENEW' | 'EXTEND') => void;
}

export function OwnerSubscriptionTable({ rows, onLifecycleAction }: OwnerSubscriptionTableProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-lg font-bold text-slate-900">Owners and subscriptions</h3>
        <p className="mt-1 text-sm text-slate-500">Grace-period accounts should be handled before fully expired records.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Listings</th>
              <th className="px-6 py-4">Subscription</th>
              <th className="px-6 py-4">Expiry</th>
              <th className="px-6 py-4 text-right">Quick actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const latest = row.subscriptions[0];

              return (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-6 py-4 font-semibold text-slate-900">{row.phone}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {row.activeListingCount}/{row.listingCount} active
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">{latest?.status ?? 'NONE'}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {latest?.endDate ? new Date(latest.endDate).toLocaleDateString() : 'Not set'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {(['ACTIVATE', 'DEACTIVATE', 'RENEW', 'EXTEND'] as const).map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => onLifecycleAction(row.id, action)}
                          className="min-h-12 rounded-2xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
