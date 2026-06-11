'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock3,
  Download,
  Landmark,
  MapPinned,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { AdminQueueCard } from '@/components/admin/AdminQueueCard';
import { AdminRejectionModal } from '@/components/admin/AdminRejectionModal';
import { AdminReviewPanel } from '@/components/admin/AdminReviewPanel';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { ExportToolbar } from '@/components/admin/ExportToolbar';
import { ListingApprovalCard, type AdminListing } from '@/components/admin/ListingApprovalCard';
import { OwnerSubscriptionTable } from '@/components/admin/OwnerSubscriptionTable';
import { PublicParkingTable } from '@/components/admin/PublicParkingTable';
import { StatsCard } from '@/components/admin/StatsCard';
import { supabase } from '@/lib/supabase';

type PendingSubscription = {
  id: string;
  utr: string;
  status: string;
  amount: number;
  createdAt: string;
  listing: {
    name: string;
    address: string;
  };
  owner: {
    phone: string;
  };
};

type OwnerRow = {
  id: string;
  phone: string;
  listingCount: number;
  activeListingCount: number;
  subscriptions: Array<{
    status: string;
    endDate?: string | null;
    gracePeriodEndsAt?: string | null;
  }>;
};

type PublicParkingRecord = {
  id: string;
  name: string;
  address: string;
  coverage: string;
  latitude: number;
  longitude: number;
  archivedAt?: string | null;
};

type Stats = {
  totalListings: number;
  pendingListings: number;
  activeSubscriptions: number;
  revenue: number;
  expiredSubscriptions: number;
  rejectedListings: number;
  publicListings: number;
  privateListings: number;
  recentActivity: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
  }>;
};

/**
 * Build the Authorization header for admin API calls from the REAL logged-in
 * session. Previously this was hardcoded to `Bearer test-token`, which only
 * worked when NEXT_PUBLIC_DEV_BYPASS_AUTH was enabled — meaning the admin panel
 * was either wide-open (bypass on in prod) or completely non-functional (bypass
 * off → every call 401'd). The dev bypass token is retained ONLY when the bypass
 * flag is explicitly set, so local work without a Supabase stack still functions.
 */
async function authHeaders(): Promise<Record<string, string>> {
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true') {
    return { Authorization: 'Bearer test-token' };
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [payments, setPayments] = useState<PendingSubscription[]>([]);
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [publicParking, setPublicParking] = useState<PublicParkingRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<{ type: 'listing' | 'payment'; id: string } | null>(null);
  const [rejectionCategory, setRejectionCategory] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exportDataset, setExportDataset] = useState('listings');
  const [toast, setToast] = useState<string | null>(null);

  const selectedListing = listings.find((listing) => listing.id === selectedListingId) ?? null;
  const selectedPayment = payments.find((payment) => payment.id === selectedPaymentId) ?? null;

  useEffect(() => {
    void Promise.all([
      fetchStats(),
      fetchListings(),
      fetchPayments(),
      fetchOwners(),
      fetchPublicParking(),
    ]);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, { headers: await authHeaders() });
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    return response.json();
  }

  async function fetchStats() {
    const data = await fetchJson<Stats>('/api/admin/stats');
    setStats(data);
  }

  async function fetchListings() {
    const data = await fetchJson<{ results: AdminListing[] }>('/api/admin/listings?status=PENDING_REVIEW');
    setListings(data.results ?? []);
    setSelectedListingId((current) => current ?? data.results?.[0]?.id ?? null);
  }

  async function fetchPayments() {
    const data = await fetchJson<{ results: PendingSubscription[] }>('/api/admin/subscriptions/pending');
    setPayments(data.results ?? []);
    setSelectedPaymentId((current) => current ?? data.results?.[0]?.id ?? null);
  }

  async function fetchOwners() {
    const data = await fetchJson<{ results: OwnerRow[] }>('/api/admin/owners');
    setOwners(data.results ?? []);
  }

  async function fetchPublicParking() {
    const data = await fetchJson<{ results: PublicParkingRecord[] }>('/api/admin/public-parking');
    setPublicParking(data.results ?? []);
  }

  async function handleListingApprove() {
    if (!selectedListing) return;
    setSubmitting(true);

    const response = await fetch(`/api/admin/listings/${selectedListing.id}`, {
      method: 'PATCH',
      headers: {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    setSubmitting(false);
    if (!response.ok) return;

    const currentIndex = listings.findIndex((item) => item.id === selectedListing.id);
    const nextListing = listings[currentIndex + 1] ?? null;
    setListings((items) => items.filter((item) => item.id !== selectedListing.id));
    setSelectedListingId(nextListing?.id ?? null);
    setToast('Listing approved. Moved to the next review item.');
    void fetchStats();
  }

  async function handlePaymentApprove() {
    if (!selectedPayment) return;
    setSubmitting(true);

    const response = await fetch('/api/admin/subscriptions/verify', {
      method: 'POST',
      headers: {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionId: selectedPayment.id, action: 'APPROVE' }),
    });

    setSubmitting(false);
    if (!response.ok) return;

    const currentIndex = payments.findIndex((item) => item.id === selectedPayment.id);
    const nextPayment = payments[currentIndex + 1] ?? null;
    setPayments((items) => items.filter((item) => item.id !== selectedPayment.id));
    setSelectedPaymentId(nextPayment?.id ?? null);
    setToast('Payment verified. Queue advanced to the next item.');
    void fetchStats();
  }

  async function handleRejectConfirm() {
    if (!rejectionTarget || !rejectionCategory) return;
    setSubmitting(true);

    if (rejectionTarget.type === 'listing') {
      await fetch(`/api/admin/listings/${rejectionTarget.id}`, {
        method: 'PATCH',
        headers: {
          ...(await authHeaders()),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'REJECT',
          rejection: {
            category: rejectionCategory,
            note: rejectionNote,
          },
        }),
      });

      setListings((items) => items.filter((item) => item.id !== rejectionTarget.id));
      setSelectedListingId((current) =>
        current === rejectionTarget.id ? listings.find((item) => item.id !== current)?.id ?? null : current
      );
      setToast('Listing rejected with a structured owner-facing reason.');
    } else {
      await fetch('/api/admin/subscriptions/verify', {
        method: 'POST',
        headers: {
          ...(await authHeaders()),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: rejectionTarget.id,
          action: 'REJECT',
          rejection: {
            category: rejectionCategory,
            note: rejectionNote,
          },
        }),
      });

      setPayments((items) => items.filter((item) => item.id !== rejectionTarget.id));
      setSelectedPaymentId((current) =>
        current === rejectionTarget.id ? payments.find((item) => item.id !== current)?.id ?? null : current
      );
      setToast('Payment rejected and left inactive with an audit reason.');
    }

    setSubmitting(false);
    setRejectionTarget(null);
    setRejectionCategory('');
    setRejectionNote('');
    void fetchStats();
  }

  async function handleArchivePublicParking(id: string) {
    await fetch(`/api/admin/public-parking/${id}`, {
      method: 'PATCH',
      headers: {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ archive: true }),
    });
    setPublicParking((rows) =>
      rows.map((row) => (row.id === id ? { ...row, archivedAt: new Date().toISOString() } : row))
    );
  }

  async function handleLifecycleAction(ownerId: string, action: 'ACTIVATE' | 'DEACTIVATE' | 'RENEW' | 'EXTEND') {
    await fetch('/api/admin/subscriptions/verify', {
      method: 'POST',
      headers: {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId: ownerId,
        action,
        extensionDays: action === 'EXTEND' ? 7 : undefined,
      }),
    });
    setToast(`Subscription ${action.toLowerCase()} requested.`);
  }

  async function handleExport() {
    setSubmitting(true);
    const response = await fetch(`/api/admin/export?dataset=${exportDataset}`, {
      headers: await authHeaders(),
    });
    const csv = await response.text();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportDataset}-export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 rounded-airbnb-lg bg-surface p-10 shadow-sm border border-border">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                 <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                 </div>
                 <p className="text-xs font-bold text-primary uppercase tracking-widest">Admin Control Center</p>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-main leading-tight">
                Review listings, verify payments,<br />and manage parking data
              </h1>
              <p className="mt-4 max-w-3xl text-text-secondary text-lg leading-relaxed">
                Streamline operations across urban India. Approve listings, verify UPI UTRs, and maintain the public parking database.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-sm font-bold text-text-main shadow-sm hover:border-text-main transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export Records
            </button>
          </div>
          {toast ? (
            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary animate-in fade-in slide-in-from-top-2">
              {toast}
            </div>
          ) : null}
        </header>

        <div className="mb-10">
            <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {stats ? (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard label="Total listings" value={stats.totalListings} icon={Landmark} description="Global repository" />
            <StatsCard label="Pending approvals" value={stats.pendingListings} icon={Clock3} tone="pending" description="Queue priority" />
            <StatsCard label="Active subscriptions" value={stats.activeSubscriptions} icon={ShieldCheck} tone="active" description="Revenue driving" />
            <StatsCard label="Revenue" value={`₹${stats.revenue}`} icon={CheckCircle2} tone="active" description="Verified total" />
            <StatsCard label="Expired / Grace" value={stats.expiredSubscriptions} icon={Activity} tone="warning" description="Follow-up list" />
            <StatsCard label="Rejected items" value={stats.rejectedListings} icon={XCircle} tone="rejected" description="Owner feedback" />
            <StatsCard label="Public spots" value={stats.publicListings} icon={MapPinned} description={`${stats.privateListings} private`} />
            <StatsCard label="Admin checks" value={stats.recentActivity.length} icon={Users} description="Decision log" />
          </section>
        ) : null}

        {(activeTab === 'overview' || activeTab === 'listings' || activeTab === 'payments') ? (
          <div className="mt-10 grid gap-8 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <AdminQueueCard
                eyebrow="Verification Queue"
                title="Listing Approval"
                description="Review new submissions for data accuracy and image quality before publishing live."
                count={listings.length}
                emptyMessage="No listings in queue."
                primaryLabel="Open Review"
                onPrimaryAction={() => {
                  setActiveTab('listings');
                  setSelectedListingId(listings[0]?.id ?? null);
                }}
              />
            </div>
            <div className="xl:col-span-6">
              <AdminQueueCard
                eyebrow="Finance Queue"
                title="Payment Verification"
                description="Cross-check UTR numbers with bank statements to activate private subscriptions."
                count={payments.length}
                emptyMessage="No pending payments."
                primaryLabel="Audit Payments"
                onPrimaryAction={() => {
                  setActiveTab('payments');
                  setSelectedPaymentId(payments[0]?.id ?? null);
                }}
              />
            </div>
            <div className="xl:col-span-6">
              {activeTab === 'payments' ? (
                <AdminReviewPanel
                  payment={selectedPayment}
                  onApprove={handlePaymentApprove}
                  onReject={() => selectedPayment && setRejectionTarget({ type: 'payment', id: selectedPayment.id })}
                  approving={submitting}
                />
              ) : (
                <div className="grid gap-4">
                  {listings.slice(0, activeTab === 'overview' ? 1 : listings.length).map((listing) => (
                    <ListingApprovalCard
                      key={listing.id}
                      listing={listing}
                      onReview={setSelectedListingId}
                      isSelected={selectedListingId === listing.id}
                      ctaLabel={activeTab === 'overview' ? 'Open Item' : 'Review'}
                    />
                  ))}
                  {listings.length === 0 && (
                     <div className="rounded-airbnb bg-gray-50 p-8 text-center border-2 border-dashed border-border">
                        <p className="text-text-secondary font-medium">Clear Queue</p>
                     </div>
                  )}
                </div>
              )}
            </div>
            <div className="xl:col-span-6">
              {activeTab === 'payments' ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <button
                      key={payment.id}
                      type="button"
                      onClick={() => setSelectedPaymentId(payment.id)}
                      className={`w-full rounded-2xl border p-5 text-left transition-all ${
                        selectedPaymentId === payment.id ? 'border-primary ring-2 ring-primary/10 bg-white shadow-md' : 'border-border bg-white hover:border-text-main shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-base font-bold text-text-main truncate">{payment.listing.name}</p>
                          <p className="mt-1 text-xs text-text-secondary font-medium">{payment.owner.phone}</p>
                        </div>
                        <span className="flex-shrink-0 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-700 border border-amber-100 uppercase tracking-wider">
                          {payment.status}
                        </span>
                      </div>
                    </button>
                  ))}
                   {payments.length === 0 && (
                     <div className="rounded-airbnb bg-gray-50 p-8 text-center border-2 border-dashed border-border">
                        <p className="text-text-secondary font-medium">All caught up</p>
                     </div>
                  )}
                </div>
              ) : (
                <AdminReviewPanel
                  listing={selectedListing}
                  onApprove={handleListingApprove}
                  onReject={() => selectedListing && setRejectionTarget({ type: 'listing', id: selectedListing.id })}
                  approving={submitting}
                />
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'publicParking' ? (
          <div className="mt-10">
            <PublicParkingTable rows={publicParking} onArchive={handleArchivePublicParking} />
          </div>
        ) : null}

        {activeTab === 'owners' ? (
          <div className="mt-10">
            <OwnerSubscriptionTable rows={owners} onLifecycleAction={handleLifecycleAction} />
          </div>
        ) : null}

        {activeTab === 'exports' ? (
          <div className="mt-10">
            <ExportToolbar
              dataset={exportDataset}
              onDatasetChange={setExportDataset}
              onExport={handleExport}
              loading={submitting}
            />
          </div>
        ) : null}

        {stats?.recentActivity?.length ? (
          <section className="mt-16 rounded-[32px] border border-border bg-surface p-10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-text-main" />
               </div>
               <h3 className="text-xl font-bold text-text-main">Audit Log</h3>
            </div>
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-5 text-sm md:flex-row md:items-center md:justify-between border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-bold text-text-main">
                        {activity.action}
                    </span>
                    <span className="text-text-secondary">on {activity.targetType}</span>
                    <span className="bg-white px-2 py-0.5 rounded text-[10px] font-mono border border-border">{activity.targetId.slice(0, 8)}</span>
                  </div>
                  <span className="text-text-secondary font-medium">{new Date(activity.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <AdminRejectionModal
        open={Boolean(rejectionTarget)}
        title={rejectionTarget?.type === 'payment' ? 'Reject verification' : 'Reject listing'}
        targetLabel={rejectionTarget?.type === 'payment' ? 'submission' : 'listing'}
        category={rejectionCategory}
        note={rejectionNote}
        onCategoryChange={setRejectionCategory}
        onNoteChange={setRejectionNote}
        onCancel={() => {
          setRejectionTarget(null);
          setRejectionCategory('');
          setRejectionNote('');
        }}
        onConfirm={handleRejectConfirm}
        submitting={submitting}
      />
    </main>
  );
}
