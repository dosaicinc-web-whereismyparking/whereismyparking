import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/parking/nearby/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

import { render, screen, fireEvent } from '@testing-library/react';
import { ParkingList } from '@/components/ParkingList';
import { ParkingListing } from '@/lib/supabase-types';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
  },
}));

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
      (prisma.$queryRawUnsafe as any).mockResolvedValue(mockResults);

      const req = new NextRequest('http://localhost:3000/api/parking/nearby?lat=12.9716&lng=77.5946');
      const response = await GET(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(2);
      expect(data.results[0].distance).toBe(101); // Math.round
      expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
    });

    it('filters by type and coverage', async () => {
      (prisma.$queryRawUnsafe as any).mockResolvedValue([]);
      
      const req = new NextRequest('http://localhost:3000/api/parking/nearby?lat=12.9716&lng=77.5946&type=PUBLIC&coverage=COVERED');
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      // Check if query contains filters
      const lastQuery = (prisma.$queryRawUnsafe as any).mock.calls.at(-1)[0];
      expect(lastQuery).toContain('"type" = $5::"ParkingType"');
      expect(lastQuery).toContain('"coverage" = $6::"CoverageType"');
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
       (prisma.$queryRawUnsafe as any).mockResolvedValue(mockResults);

       const req = new NextRequest('http://localhost:3000/api/parking/nearby?lat=12.9716&lng=77.5946&limit=1');
       const response = await GET(req);
       const data = await response.json();
       
       expect(response.status).toBe(200);
       expect(data.results).toHaveLength(1);
       expect(data.nextCursor).toBeDefined();
    });
  });
});
