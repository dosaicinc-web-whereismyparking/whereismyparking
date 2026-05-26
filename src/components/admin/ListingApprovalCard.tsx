import { Clock3, MapPin, Phone } from 'lucide-react';

export interface AdminListing {
  id: string;
  name: string;
  address: string;
  status: string;
  moderationStatus?: string;
  coverage?: string;
  notes?: string | null;
  vehicleTypes?: string[] | null;
  sourceType?: string;
  createdAt: string;
  owner: {
    phone: string;
  };
}

interface ListingApprovalCardProps {
  listing: AdminListing;
  onReview: (id: string) => void;
  ctaLabel?: string;
  isSelected?: boolean;
}

export function ListingApprovalCard({
  listing,
  onReview,
  ctaLabel = 'Review next item',
}: ListingApprovalCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            <Clock3 className="h-3.5 w-3.5" />
            {listing.moderationStatus ?? listing.status}
          </div>
          <h3 className="text-xl font-bold text-slate-900">{listing.name}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-slate-400" />
            {listing.address}
          </p>
        </div>
      </div>

      <dl className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Owner</dt>
          <dd className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Phone className="h-4 w-4 text-slate-400" />
            {listing.owner.phone}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Submission</dt>
          <dd className="mt-2 text-sm font-semibold text-slate-700">
            {new Date(listing.createdAt).toLocaleString()}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
        {listing.coverage ? <span className="rounded-full bg-slate-100 px-3 py-1">{listing.coverage}</span> : null}
        {listing.sourceType ? <span className="rounded-full bg-slate-100 px-3 py-1">{listing.sourceType}</span> : null}
        {(listing.vehicleTypes ?? []).map((vehicle) => (
          <span key={vehicle} className="rounded-full bg-slate-100 px-3 py-1">
            {vehicle}
          </span>
        ))}
      </div>

      {listing.notes ? <p className="mt-4 text-sm text-slate-600">{listing.notes}</p> : null}

      <button
        type="button"
        onClick={() => onReview(listing.id)}
        className="mt-6 inline-flex min-h-16 w-full items-center justify-center rounded-2xl bg-[#1A4A8A] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#163d71]"
      >
        {ctaLabel}
      </button>
    </article>
  );
}
