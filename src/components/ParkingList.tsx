'use client';

import React from 'react';
import { ParkingListing, ParkingType, CoverageType } from '@/lib/supabase-types';
import { MapPin, Filter, SearchX } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-surface">
      {/* List Header */}
      <div className="px-6 py-6 border-b border-border space-y-4">
        <div>
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            Nearby Spaces
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {parkingData.length} {parkingData.length === 1 ? 'place' : 'places'} found nearby
          </p>
        </div>

        {/* Horizontal Filters - Pill Style */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="relative flex-shrink-0">
             <select
                className="appearance-none bg-white border border-border rounded-full px-5 py-2 text-sm font-semibold text-text-main hover:border-text-main focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all cursor-pointer min-w-[120px]"
                value={filters.type}
                onChange={(e) => onFilterChange({ ...filters, type: e.target.value as any })}
              >
                <option value="ALL">All Types</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                 <svg viewBox="0 0 18 18" className="w-3 h-3 fill-current"><path d="m16.29 4.3a1 1 0 1 1 1.41 1.42l-8 8a1 1 0 0 1 -1.41 0l-8-8a1 1 0 1 1 1.41-1.42l7.29 7.29z"></path></svg>
              </div>
          </div>

          <div className="relative flex-shrink-0">
             <select
                className="appearance-none bg-white border border-border rounded-full px-5 py-2 text-sm font-semibold text-text-main hover:border-text-main focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all cursor-pointer min-w-[140px]"
                value={filters.coverage}
                onChange={(e) => onFilterChange({ ...filters, coverage: e.target.value as any })}
              >
                <option value="ALL">All Coverage</option>
                <option value="OPEN">Open space</option>
                <option value="COVERED">Covered</option>
                <option value="MULTI">Multi-level</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                 <svg viewBox="0 0 18 18" className="w-3 h-3 fill-current"><path d="m16.29 4.3a1 1 0 1 1 1.41 1.42l-8 8a1 1 0 0 1 -1.41 0l-8-8a1 1 0 1 1 1.41-1.42l7.29 7.29z"></path></svg>
              </div>
          </div>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {parkingData.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center h-full">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <SearchX className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-text-main font-bold text-lg">No parking spots found</p>
            <p className="text-text-secondary text-sm mt-1">Try adjusting your filters or area.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-y divide-border">
            {parkingData.map((parking, index) => (
              <ParkingCard
                key={parking.id}
                parking={parking}
                isSelected={selectedId === parking.id}
                onSelect={() => onSelect(parking.id)}
                priority={index < 4}
                id={`parking-${parking.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkingList;
