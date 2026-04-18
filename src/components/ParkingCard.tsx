import React from 'react';
import { ParkingListing } from '@/lib/supabase-types';
import { Clock, Navigation, Heart } from 'lucide-react';
import { NavigateButton } from './NavigateButton';
import OptimizedImage from './Image';

interface ParkingCardProps {
  parking: ParkingListing;
  isSelected: boolean;
  onSelect: () => void;
  priority?: boolean;
}

export const ParkingCard: React.FC<ParkingCardProps> = ({
  parking,
  isSelected,
  onSelect,
  priority = false,
}) => {
  return (
    <div
      className={`group p-4 transition-all cursor-pointer relative border-b border-border ${
        isSelected ? 'bg-surface ring-2 ring-primary/20 z-10' : 'bg-transparent hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-airbnb mb-3">
        {parking.images && parking.images.length > 0 ? (
          <OptimizedImage
            src={parking.images[0]}
            alt={parking.name}
            priority={priority}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}
        <button 
          className="absolute top-3 right-3 p-2 bg-transparent hover:scale-110 transition-transform active:scale-95 text-white drop-shadow-md"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <Heart className="w-6 h-6 stroke-[2px]" />
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-text-main line-clamp-1">{parking.name}</h3>
          {parking.distance !== undefined && (
            <span className="text-sm font-medium text-text-main shrink-0">
              {(parking.distance / 1000).toFixed(1)} km
            </span>
          )}
        </div>

        <p className="text-sm text-text-secondary line-clamp-1">{parking.address}</p>

        <div className="flex items-center gap-2 text-xs text-text-secondary pt-1">
           <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" className="w-3 h-3 fill-current"><path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.564 1.764l7.246 6.574-1.899 9.736a1 1 0 0 0 1.489 1.081L16 26.21l8.612 4.683a1 1 0 0 0 1.49-1.081l-1.9-9.736 7.248-6.574a1 1 0 0 0-.563-1.764l-9.86-1.27L16.906 1.58a1 1 0 0 0-1.812 0z"></path></svg>
           <span className="font-semibold text-text-main">4.8</span>
           <span className="text-gray-300">•</span>
           <span>{parking.type}</span>
           <span className="text-gray-300">•</span>
           <span>{parking.coverage}</span>
        </div>

        <div className="pt-3 flex gap-2 overflow-hidden">
          <NavigateButton
            latitude={parking.latitude}
            longitude={parking.longitude}
            name={parking.name}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          />
        </div>
      </div>
    </div>
  );
};