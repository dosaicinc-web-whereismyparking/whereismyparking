import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

export type GeolocationStatus = 'idle' | 'prompt' | 'granted' | 'denied' | 'error' | 'loading';

interface GeolocationState {
  position: GeolocationPosition | null;
  status: GeolocationStatus;
  error: string | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    status: 'idle',
    error: null,
  });

  const isMounted = useRef(true);
  const isRequesting = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, status: 'error', error: 'Geolocation not supported' }));
      return;
    }

    if (isRequesting.current) return;
    isRequesting.current = true;

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        isRequesting.current = false;
        if (!isMounted.current) return;
        
        setState({
          position: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          status: 'granted',
          error: null,
        });
      },
      (err) => {
        isRequesting.current = false;
        if (!isMounted.current) return;

        let status: GeolocationStatus = 'error';
        let errorMsg = 'An unknown error occurred';

        switch (err.code) {
          case err.PERMISSION_DENIED:
            status = 'denied';
            errorMsg = 'User denied the request for Geolocation.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable.';
            break;
          case err.TIMEOUT:
            errorMsg = 'The request to get user location timed out.';
            break;
        }

        setState(prev => ({ ...prev, status, error: errorMsg }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Check permission status initially and listen for changes
  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      if (!isMounted.current || !permissionStatus) return;

      const newState = permissionStatus.state;
      
      setState(prev => {
        if (newState === 'granted') {
          // If it changed to granted and we don't have position/not loading, request it
          if (prev.status !== 'granted' && prev.status !== 'loading') {
            // We can't call requestLocation here directly as it's a side effect in updater
            // But we can trigger it in a separate effect or just wait for the next render
            return { ...prev }; 
          }
        } else if (newState === 'denied') {
          return { ...prev, status: 'denied', position: null, error: 'User denied the request for Geolocation.' };
        } else if (newState === 'prompt') {
          return { ...prev, status: 'prompt', position: null, error: null };
        }
        return prev;
      });

      // Trigger request outside of setState updater
      if (newState === 'granted') {
        requestLocation();
      }
    };

    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
        if (!isMounted.current) return;
        permissionStatus = status;
        
        // Initial state sync
        setState(prev => {
          if (prev.status !== 'idle') return prev;
          
          if (status.state === 'granted') {
            return { ...prev }; // Will trigger requestLocation below
          } else {
            return { ...prev, status: status.state === 'prompt' ? 'prompt' : 'denied' };
          }
        });

        if (status.state === 'granted') {
          requestLocation();
        }

        status.onchange = handlePermissionChange;
      }).catch(() => {
        // Fallback for browsers that don't support permissions API well
        if (isMounted.current) {
          setState(prev => prev.status === 'idle' ? { ...prev, status: 'prompt' } : prev);
        }
      });
    } else {
      setState(prev => prev.status === 'idle' ? { ...prev, status: 'prompt' } : prev);
    }

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [requestLocation]);

  return {
    position: state.position,
    status: state.status,
    error: state.error,
    loading: state.status === 'loading',
    requestLocation,
  };
};
