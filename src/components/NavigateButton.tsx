import React from 'react';

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
  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${name}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleNavigate}
      className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 ${className}`}
      aria-label={`Navigate to ${name} parking`}
    >
      Navigate
    </button>
  );
};