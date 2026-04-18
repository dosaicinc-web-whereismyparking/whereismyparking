interface ExportToolbarProps {
  dataset: string;
  onDatasetChange: (value: string) => void;
  onExport: () => void;
  loading?: boolean;
}

const options = [
  { value: 'listings', label: 'Listings' },
  { value: 'owners', label: 'Owners' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'payments', label: 'Payment history' },
];

export function ExportToolbar({ dataset, onDatasetChange, onExport, loading = false }: ExportToolbarProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Filtered export</h3>
      <p className="mt-2 text-sm text-slate-500">
        Exports are scoped to the current dataset and keep the admin review flow separate from reporting.
      </p>
      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end">
        <label className="flex-1">
          <span className="text-sm font-bold text-slate-700">Dataset</span>
          <select
            value={dataset}
            onChange={(event) => onDatasetChange(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onExport}
          disabled={loading}
          className="min-h-12 rounded-2xl bg-[#1A4A8A] px-5 py-3 text-sm font-bold text-white disabled:bg-slate-300"
        >
          {loading ? 'Preparing export...' : 'Download CSV'}
        </button>
      </div>
    </section>
  );
}
