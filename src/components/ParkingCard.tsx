import React from 'react';
import { ParkingListing } from '@/lib/supabase-types';
import { Clock } from 'lucide-react';
import { NavigateButton } from './NavigateButton';

interface ParkingCardProps {
  parking: ParkingListing;
  isSelected: boolean;
  onSelect: () => void;
}

export const ParkingCard: React.FC<ParkingCardProps> = ({
  parking,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      className={`p-6 transition-all cursor-pointer hover:bg-white relative border-b border-gray-100 ${
        isSelected ? 'bg-white ring-2 ring-srd-blue ring-inset z-10' : 'bg-transparent'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-extrabold text-srd-blue">{parking.name}</h3>
        {parking.distance !== undefined && (
          <span className="text-[10px] font-black text-srd-orange bg-srd-orange/10 px-2 py-1 rounded">
            {(parking.distance / 1000).toFixed(1)} km
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3">{parking.address}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
          {parking.type}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
          {parking.coverage}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <Clock className="w-3 h-3" />
          <span>24/7 Available</span>
        </div>
      </div>

      <NavigateButton
        latitude={parking.latitude}
        longitude={parking.longitude}
        name={parking.name}
        className="w-full flex items-center justify-center gap-2 bg-srd-orange hover:bg-srd-orange/90 text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-[0.98]"
      />
    </div>
  );
};