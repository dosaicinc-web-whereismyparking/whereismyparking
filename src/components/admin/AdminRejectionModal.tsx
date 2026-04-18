const rejectionCategories = [
  'Incorrect location details',
  'Photos or evidence missing',
  'Payment reference invalid',
  'Policy or compliance issue',
];

interface AdminRejectionModalProps {
  open: boolean;
  title: string;
  targetLabel: string;
  category: string;
  note: string;
  onCategoryChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  submitting?: boolean;
}

export function AdminRejectionModal({
  open,
  title,
  targetLabel,
  category,
  note,
  onCategoryChange,
  onNoteChange,
  onCancel,
  onConfirm,
  submitting = false,
}: AdminRejectionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
        <p className="text-sm font-bold text-red-600">{title}</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Reject {targetLabel}?</h2>
        <p className="mt-3 text-sm text-slate-600">
          A rejection reason is required and the owner will be told exactly what to fix before resubmitting.
        </p>

        <label className="mt-6 block">
          <span className="text-sm font-bold text-slate-700">Rejection category</span>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
          >
            <option value="">Select a reason</option>
            {rejectionCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-slate-700">Optional note</span>
          <textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900"
            placeholder="Explain what the owner should correct before resubmitting."
          />
        </label>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Owner preview: {category || 'Select a rejection category'} {note ? `- ${note}` : ''}
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!category || submitting}
            onClick={onConfirm}
            className="min-h-12 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {submitting ? 'Rejecting...' : 'Confirm rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}
