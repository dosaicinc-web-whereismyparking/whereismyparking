import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublicParkingForm } from '@/components/admin/PublicParkingForm';
import { NavigateButton } from '@/components/NavigateButton';
import OptimizedImage from '@/components/Image';
import { metadata as layoutMetadata } from '@/app/layout';
import { generateMetadata as generateListingMetadata } from '@/app/listings/[id]/page';
import nextConfig from '../next.config';

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter' }),
  Outfit: () => ({ className: 'outfit' }),
}));

// Mock fetch
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

// Mock dynamic imports or other components if needed
vi.mock('next/image', () => ({
  default: ({ priority, ...props }: any) => (
    <img 
      {...props} 
      fetchpriority={priority ? 'high' : undefined} 
    />
  )
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { name: 'Sunset Parking', address: 'Beach Rd', type: 'PUBLIC' },
        error: null
      })
    }))
  }
}));

describe('Phase 4: Launch Readiness & Operational Polish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADM-03: Public Parking Form', () => {
    it('validates required fields and submits data', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<PublicParkingForm />);

      // Submit empty form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText(/string to have >=3 characters/i)).toBeInTheDocument();
      });

      // Fill form correctly
      const nameInput = screen.getByPlaceholderText(/MG Road/i);
      const addressInput = screen.getByPlaceholderText(/Enter complete address/i);
      
      // Finding inputs by label text since labels are not associated via id/htmlFor
      const latitudeInput = screen.getByText(/Latitude/i).parentElement?.querySelector('input')!;
      const longitudeInput = screen.getByText(/Longitude/i).parentElement?.querySelector('input')!;
      const coverageSelect = screen.getByText(/Coverage/i).parentElement?.querySelector('select')!;
      const hoursTextarea = screen.getByText(/Operating Hours/i).parentElement?.querySelector('textarea')!;

      fireEvent.change(nameInput, { target: { value: 'Test Parking' } });
      fireEvent.change(addressInput, { target: { value: '123 Test Street, Bangalore' } });
      fireEvent.change(latitudeInput, { target: { value: '12.97' } });
      fireEvent.change(longitudeInput, { target: { value: '77.59' } });
      fireEvent.change(coverageSelect, { target: { value: 'COVERED' } });

      // Select vehicle type
      fireEvent.click(screen.getByLabelText(/Car/i));

      fireEvent.change(hoursTextarea, { target: { value: '24/7' } });

      // Submit again
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/admin/public-parking', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"Test Parking"')
        }));
      });
    });
  });

  describe('SEO-01..05: Metadata', () => {
    it('has correct global metadata in layout', () => {
      expect(layoutMetadata.title).toContain('WhereIsMyParking');
      expect(layoutMetadata.description).toBeDefined();
      expect((layoutMetadata.openGraph as any)?.type).toBe('website');
    });

    it('generates correct dynamic metadata for listings', async () => {
      const metadata = await generateListingMetadata({ params: Promise.resolve({ id: '123' }) });
      expect(metadata.title).toBe('Sunset Parking Parking - WhereIsMyParking');
      expect(metadata.description).toContain('Beach Rd');
    });
  });

  describe('NAV-01: NavigateButton', () => {
    it('generates correct Google Maps URL', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<NavigateButton latitude={12.9} longitude={77.6} name="Central-Parking" />);
      
      fireEvent.click(screen.getByRole('button', { name: /navigate/i }));
      
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('destination=12.9,77.6'),
        '_blank'
      );
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('destination_place_id=Central-Parking'),
        '_blank'
      );
    });
  });

  describe('PERF-01: Performance Optimization', () => {
    it('OptimizedImage handles priority and lazy loading', () => {
      const { rerender } = render(<OptimizedImage src="/test.jpg" alt="Test" width={100} height={100} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');

      rerender(<OptimizedImage src="/test.jpg" alt="Test" width={100} height={100} priority />);
      expect(img).toHaveAttribute('loading', 'eager');
      expect(img).toHaveAttribute('fetchpriority', 'high'); // Next.js Image with priority
    });

    it('next.config matches performance requirements', () => {
      expect(nextConfig.images?.formats).toContain('image/webp');
      expect(nextConfig.images?.remotePatterns).toContainEqual(expect.objectContaining({ hostname: '*.supabase.co' }));
    });
  });
});
