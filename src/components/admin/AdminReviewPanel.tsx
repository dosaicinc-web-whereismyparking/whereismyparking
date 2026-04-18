import type { AdminListing } from '@/components/admin/ListingApprovalCard';

interface ReviewPayment {
  id: string;
  utr?: string | null;
  amount?: number;
  status: string;
  createdAt: string;
  owner?: { phone: string };
  listing?: { name: string; address?: string };
}

interface AdminReviewPanelProps {
  listing?: AdminListing | null;
  payment?: ReviewPayment | null;
  onApprove: () => void;
  onReject: () => void;
  approving?: boolean;
}

export function AdminReviewPanel({
  listing,
  payment,
  onApprove,
  onReject,
  approving = false,
}: AdminReviewPanelProps) {
  if (!listing && !payment) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
        Select a queue item to inspect the full submission before taking action.
      </section>
    );
  }

  const isListing = Boolean(listing);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{isListing ? 'Listing review' : 'Payment review'}</p>
      <h3 className="mt-2 text-2xl font-bold text-slate-900">
        {listing?.name ?? payment?.listing?.name}
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        {listing?.address ?? payment?.listing?.address}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Owner</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {listing?.owner.phone ?? payment?.owner?.phone ?? 'Unknown'}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Status</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{listing?.status ?? payment?.status}</p>
        </div>
        {payment ? (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">UTR</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{payment.utr ?? 'Pending'}</p>
          </div>
        ) : null}
        {payment ? (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Amount</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">Rs {payment.amount ?? 499}</p>
          </div>
        ) : null}
      </div>

      {listing?.notes ? (
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          {listing.notes}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onReject}
          className="min-h-12 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={approving}
          className="min-h-12 rounded-2xl bg-[#1A4A8A] px-4 py-3 text-sm font-bold text-white disabled:bg-slate-300"
        >
          {approving ? 'Saving...' : isListing ? 'Approve listing' : 'Verify payment'}
        </button>
      </div>
    </section>
  );
}
