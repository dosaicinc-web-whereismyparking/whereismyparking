'use client';

import React from 'react';
import { ParkingListing, ParkingType, CoverageType } from '@/lib/supabase-types';
import { MapPin, Filter } from 'lucide-react';
import { ParkingCard } from './ParkingCard';

interface ParkingListProps {
  parkingData: ParkingListing[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  filters: {
    type: ParkingType | 'ALL';
    coverage: CoverageType | 'ALL';
  };
  onFilterChange: (filters: { type: ParkingType | 'ALL'; coverage: CoverageType | 'ALL' }) => void;
}

export const ParkingList: React.FC<ParkingListProps> = ({
  parkingData,
  selectedId,
  onSelect,
  filters,
  onFilterChange,
}) => {
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-srd-bg">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-srd-blue tracking-tight">
          <MapPin className="w-5 h-5" />
          Nearby Parking
        </h2>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="bg-transparent text-sm focus:outline-none"
              value={filters.type}
              onChange={(e) => onFilterChange({ ...filters, type: e.target.value as any })}
            >
              <option value="ALL">All Types</option>
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
            <select
              className="bg-transparent text-sm focus:outline-none"
              value={filters.coverage}
              onChange={(e) => onFilterChange({ ...filters, coverage: e.target.value as any })}
            >
              <option value="ALL">All Coverage</option>
              <option value="OPEN">Open</option>
              <option value="COVERED">Covered</option>
              <option value="MULTI">Multi-level</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {parkingData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No parking spots found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {parkingData.map((parking) => (
              <ParkingCard
                key={parking.id}
                parking={parking}
                isSelected={selectedId === parking.id}
                onSelect={() => onSelect(parking.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkingList;
