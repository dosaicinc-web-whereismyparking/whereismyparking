import React from 'react';
import { Navigation } from 'lucide-react';

interface NavigateButtonProps {
  latitude: number;
  longitude: number;
  name: string;
  className?: string;
}

export const NavigateButton: React.FC<NavigateButtonProps> = ({
  latitude,
  longitude,
  name,
  className = ''
}) => {
  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${name}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleNavigate}
      className={`flex items-center justify-center gap-2 bg-text-main hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all active:scale-95 ${className}`}
      aria-label={`Navigate to ${name} parking`}
    >
      <Navigation className="w-4 h-4" />
      <span>Navigate</span>
    </button>
  );
};