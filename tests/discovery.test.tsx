import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/parking/nearby/route';
import { NextRequest } from 'next/server';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ParkingList } from '@/components/ParkingList';
import { ListingForm } from '@/components/ListingForm';
import { ParkingListing } from '@/lib/supabase-types';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
    rpc: vi.fn(),
  },
}));

vi.mock('@/components/Map', () => ({
  ParkingMap: () => <div data-testid="mock-map" />,
}));

vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

// Re-import supabase to use the mocked version in tests
import { supabase } from '@/lib/supabase';

describe('Parking Discovery (Phase 1)', () => {
  const mockParkingData: ParkingListing[] = [
    {
      id: '1',
      name: 'Central Mall Parking',
      address: 'MG Road, Bangalore',
      type: 'PUBLIC',
      coverage: 'COVERED',
      availableHours: {},
      status: 'ACTIVE',
      latitude: 12.9716,
      longitude: 77.5946,
      distance: 500,
      ownerId: 'owner-1',
    },
    {
      id: '2',
      name: 'Brigade Road Spot',
      address: 'Brigade Road, Bangalore',
      type: 'PRIVATE',
      coverage: 'OPEN',
      availableHours: {},
      status: 'ACTIVE',
      latitude: 12.9734,
      longitude: 77.6012,
      distance: 1200,
      ownerId: 'owner-2',
    },
  ];

  describe('Parking list component', () => {
    it('DISC-01: displays list of nearby parking spaces with metadata', () => {
      render(
        <ParkingList 
          parkingData={mockParkingData} 
          selectedId={null} 
          onSelect={() => {}} 
          filters={{ type: 'ALL', coverage: 'ALL' }}
          onFilterChange={() => {}}
        />
      );

      expect(screen.getByText('Central Mall Parking')).toBeInTheDocument();
      expect(screen.getByText('MG Road, Bangalore')).toBeInTheDocument();
      expect(screen.getByText('0.5 km')).toBeInTheDocument();
      expect(screen.getByText('PUBLIC')).toBeInTheDocument();
      expect(screen.getByText('COVERED')).toBeInTheDocument();
    });

    it('DISC-02 & DISC-03: contains filter dropdowns for type and coverage', () => {
      render(
        <ParkingList 
          parkingData={mockParkingData} 
          selectedId={null} 
          onSelect={() => {}} 
          filters={{ type: 'ALL', coverage: 'ALL' }}
          onFilterChange={() => {}}
        />
      );

      expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Coverage')).toBeInTheDocument();
    });

    it('DISC-05: has a Navigate button that opens Google Maps', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(
        <ParkingList 
          parkingData={[mockParkingData[0]]} 
          selectedId={null} 
          onSelect={() => {}} 
          filters={{ type: 'ALL', coverage: 'ALL' }}
          onFilterChange={() => {}}
        />
      );

      const navigateBtn = screen.getByRole('button', { name: /navigate/i });
      fireEvent.click(navigateBtn);

      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('google.com/maps/dir'),
        '_blank'
      );
      openSpy.mockRestore();
    });

    it('DISC-06: shows placeholder when no results found', () => {
      render(
        <ParkingList 
          parkingData={[]} 
          selectedId={null} 
          onSelect={() => {}} 
          filters={{ type: 'ALL', coverage: 'ALL' }}
          onFilterChange={() => {}}
        />
      );

      expect(screen.getByText(/no parking spots found/i)).toBeInTheDocument();
    });

    it('DISC-04: shows availability timing for each parking listing', () => {
      render(
        <ParkingList 
          parkingData={mockParkingData} 
          selectedId={null} 
          onSelect={() => {}} 
          filters={{ type: 'ALL', coverage: 'ALL' }}
          onFilterChange={() => {}}
        />
      );

      // Each listing should display availability information
      const availabilityElements = screen.getAllByText(/available/i);
      expect(availabilityElements.length).toBeGreaterThanOrEqual(mockParkingData.length);
    });
  });

  describe('Nearby search API', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('returns filtered results with distances', async () => {
      const mockResults = [
        { id: '1', name: 'Test Parking', distance: 100.5, status: 'ACTIVE' },
        { id: '2', name: 'Other Parking', distance: 200.1, status: 'ACTIVE' },
      ];
      (supabase.rpc as any).mockResolvedValue({ data: mockResults, error: null });

      const req = new NextRequest('http://localhost:3000/api/parking/nearby?lat=12.9716&lng=77.5946');
      const response = await GET(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(2);
      expect(data.results[0].distance).toBe(101); // Math.round
      expect(supabase.rpc).toHaveBeenCalledWith('search_nearby_parking', expect.any(Object));
    });

    it('filters by type and coverage', async () => {
      (supabase.rpc as any).mockResolvedValue({ data: [], error: null });
      
      const req = new NextRequest('http://localhost:3000/api/parking/nearby?lat=12.9716&lng=77.5946&type=PUBLIC&coverage=COVERED');
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      // Check if RPC was called with filters
      expect(supabase.rpc).toHaveBeenCalledWith('search_nearby_parking', expect.objectContaining({
        p_type: 'PUBLIC',
        p_coverage: 'COVERED'
      }));
    });
  });

  describe('API performance and errors', () => {
    it('handles invalid coordinates', async () => {
      const req = new NextRequest('http://localhost:3000/api/parking/nearby?lat=91&lng=181');
      const response = await GET(req);
      expect(response.status).toBe(400);
    });

    it('returns next cursor for pagination', async () => {
       const mockResults = [
         { id: '1', name: 'P1', distance: 100 },
         { id: '2', name: 'P2', distance: 200 },
       ];
       (supabase.rpc as any).mockResolvedValue({ data: mockResults, error: null });

       const req = new NextRequest('http://localhost:3000/api/parking/nearby?lat=12.9716&lng=77.5946&limit=1');
       const response = await GET(req);
       const data = await response.json();
       
       expect(response.status).toBe(200);
       expect(data.results).toHaveLength(1);
       expect(data.nextCursor).toBeDefined();
    });
  });

  describe('ListingForm Validation', () => {
    it('PH5-BUG-01: Step 1 cannot progress if name or address are empty', async () => {
      render(<ListingForm />);
      
      const continueBtn = screen.getByRole('button', { name: /continue to map/i });
      fireEvent.click(continueBtn);

      // Should still be on Step 1 (Basic Information header should be visible)
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      // Error messages should appear
      await waitFor(() => {
        expect(screen.getByText(/name must be at least 3 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/address must be at least 5 characters/i)).toBeInTheDocument();
      });
    });

    it('PH5-BUG-01: Progression to Step 2 only occurs when fields are valid', async () => {
      render(<ListingForm />);
      
      const nameInput = screen.getByLabelText(/listing name/i);
      const addressInput = screen.getByLabelText(/physical address/i);
      
      fireEvent.change(nameInput, { target: { value: 'My Parking Spot' } });
      fireEvent.change(addressInput, { target: { value: '123 Main St, Kochi' } });
      
      const continueBtn = screen.getByRole('button', { name: /continue to map/i });
      fireEvent.click(continueBtn);

      // Should progress to Step 2 (Set Location header should be visible)
      await waitFor(() => {
        expect(screen.getByText('Set Location')).toBeInTheDocument();
      });
      expect(screen.queryByText('Basic Information')).not.toBeInTheDocument();
    });
  });
});
