import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboard from '@/app/admin/page';

const makeJsonResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  });

describe('Phase 3 admin dashboard', () => {
  beforeEach(() => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/admin/stats')) {
        return makeJsonResponse({
          totalListings: 42,
          pendingListings: 2,
          activeSubscriptions: 9,
          revenue: 4491,
          expiredSubscriptions: 1,
          rejectedListings: 1,
          publicListings: 10,
          privateListings: 32,
          recentActivity: [
            {
              id: 'activity-1',
              action: 'listing.approved',
              targetType: 'listing',
              targetId: 'listing-1',
              createdAt: new Date().toISOString(),
            },
          ],
        });
      }

      if (url.includes('/api/admin/listings')) {
        return makeJsonResponse({
          results: [
            {
              id: 'listing-1',
              name: 'Indiranagar Premium Slot',
              address: '100ft Rd, Indiranagar',
              status: 'PENDING',
              moderationStatus: 'PENDING_REVIEW',
              coverage: 'COVERED',
              notes: 'Covered basement slot.',
              vehicleTypes: ['CAR'],
              sourceType: 'OWNER_SUBMISSION',
              createdAt: new Date().toISOString(),
              owner: { phone: '+919876543210' },
            },
            {
              id: 'listing-2',
              name: 'Koramangala Evening Spot',
              address: 'Koramangala, Bengaluru',
              status: 'PENDING',
              moderationStatus: 'PENDING_REVIEW',
              createdAt: new Date().toISOString(),
              owner: { phone: '+919812345678' },
            },
          ],
        });
      }

      if (url.includes('/api/admin/subscriptions/pending')) {
        return makeJsonResponse({
          results: [
            {
              id: 'sub-1',
              utr: 'UTR123',
              status: 'PENDING_VERIFICATION',
              amount: 499,
              createdAt: new Date().toISOString(),
              listing: { name: 'Indiranagar Premium Slot', address: '100ft Rd, Indiranagar' },
              owner: { phone: '+919876543210' },
            },
          ],
        });
      }

      if (url.includes('/api/admin/owners')) {
        return makeJsonResponse({
          results: [
            {
              id: 'owner-1',
              phone: '+919876543210',
              listingCount: 2,
              activeListingCount: 1,
              subscriptions: [
                {
                  status: 'ACTIVE',
                  endDate: new Date().toISOString(),
                  gracePeriodEndsAt: null,
                },
              ],
            },
          ],
        });
      }

      if (url.includes('/api/admin/public-parking')) {
        return makeJsonResponse({
          results: [
            {
              id: 'public-1',
              name: 'Brigade Road Public Parking',
              address: 'Brigade Road',
              coverage: 'OPEN',
              latitude: 12.97,
              longitude: 77.6,
              archivedAt: null,
            },
          ],
        });
      }

      if (url.includes('/api/admin/export')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({}),
          text: async () => '"owners","all","",""',
          headers: new Headers({ 'Content-Type': 'text/csv' }),
        });
      }

      if (init?.method === 'PATCH' || init?.method === 'POST') {
        return makeJsonResponse({ success: true });
      }

      return makeJsonResponse({});
    });

    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:admin-export');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  });

  it('renders the action-center overview with KPI cards and priority queues', async () => {
    render(<AdminDashboard />);

    expect(await screen.findByText(/Admin action center/i)).toBeInTheDocument();
    expect(await screen.findByText('Pending approvals')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /listing review/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /payment verification/i })).toBeInTheDocument();
    expect(screen.getAllByText('Indiranagar Premium Slot').length).toBeGreaterThan(0);
  });

  it('switches to payment verification and shows the queue item detail panel', async () => {
    render(<AdminDashboard />);

    fireEvent.click(await screen.findByRole('button', { name: /payment verification/i }));

    expect(await screen.findByText(/Payment review/i)).toBeInTheDocument();
    expect(screen.getByText('UTR123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify payment/i })).toBeInTheDocument();
  });

  it('requires a structured rejection reason in the shared rejection modal', async () => {
    render(<AdminDashboard />);

    fireEvent.click(await screen.findByRole('button', { name: /reject/i }));

    expect(await screen.findByRole('heading', { name: /Reject listing/i })).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: /confirm rejection/i });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Rejection category/i), {
      target: { value: 'Incorrect location details' },
    });
    expect(confirmButton).not.toBeDisabled();
  });

  it('shows public parking and owner lifecycle management surfaces', async () => {
    render(<AdminDashboard />);

    fireEvent.click(await screen.findByRole('button', { name: /public parking/i }));
    expect(await screen.findByText(/Brigade Road Public Parking/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /archive record/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /owners & subscriptions/i }));
    expect(await screen.findByText(/\+919876543210/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /renew/i })).toBeInTheDocument();
  });

  it('triggers filtered export download from the export toolbar', async () => {
    render(<AdminDashboard />);

    fireEvent.click(await screen.findByRole('button', { name: /^Exports$/i }));

    const downloadSpy = vi.spyOn(document.body, 'appendChild');
    fireEvent.change(await screen.findByLabelText(/Dataset/i), {
      target: { value: 'owners' },
    });
    fireEvent.click(screen.getByRole('button', { name: /download csv/i }));

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalled();
    });
  });
});
