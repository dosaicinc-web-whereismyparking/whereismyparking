interface PublicParkingRecord {
  id: string;
  name: string;
  address: string;
  coverage: string;
  archivedAt?: string | null;
  latitude?: number;
  longitude?: number;
}

interface PublicParkingTableProps {
  rows: PublicParkingRecord[];
  onArchive: (id: string) => void;
}

export function PublicParkingTable({ rows, onArchive }: PublicParkingTableProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Public parking management</h3>
          <p className="mt-1 text-sm text-slate-500">Archive-only row actions keep records restorable for audit.</p>
        </div>
        <button
          type="button"
          onClick={() => (window as any).dispatchAddPublicParking?.()}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1A4A8A] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100"
        >
          Add new record
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <th className="px-6 py-4">Record</th>
              <th className="px-6 py-4">Coverage</th>
              <th className="px-6 py-4">Coordinates</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{row.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{row.address}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{row.coverage}</td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  {row.latitude}, {row.longitude}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                  {row.archivedAt ? 'Archived' : 'Active'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onArchive(row.id)}
                    className="min-h-12 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
                  >
                    Archive record
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
