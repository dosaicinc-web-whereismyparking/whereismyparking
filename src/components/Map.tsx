'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Map, { 
  Source, 
  Layer, 
  NavigationControl, 
  FullscreenControl, 
  GeolocateControl, 
  Popup,
  MapRef,
  LayerProps
} from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ParkingListing } from '@/lib/supabase-types';

interface MapProps {
  parkingData: ParkingListing[];
  onMove?: (viewState: any) => void;
  onSelect?: (id: string | null) => void;
  selectedId?: string | null;
  initialViewState?: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const clusterLayer: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'parking-spots',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 50, '#f28cb1'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40]
  }
};

const clusterCountLayer: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'parking-spots',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  }
};

const unclusteredPointLayer: LayerProps = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'parking-spots',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#11b4da',
    'circle-radius': 10,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#fff'
  }
};

// Add a highlight layer for the selected point
const highlightLayer: LayerProps = {
  id: 'highlighted-point',
  type: 'circle',
  source: 'parking-spots',
  filter: ['==', ['get', 'id'], ''], // Initial empty filter
  paint: {
    'circle-color': '#ef4444',
    'circle-radius': 12,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#fff'
  }
};

export const ParkingMap: React.FC<MapProps> = ({
  parkingData,
  onMove,
  onSelect,
  selectedId,
  initialViewState = {
    latitude: 12.9716, // Bangalore default
    longitude: 77.5946,
    zoom: 13
  }
}) => {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState(initialViewState);
  const [popupInfo, setPopupInfo] = useState<ParkingListing | null>(null);

  const geojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: parkingData.map(p => ({
      type: 'Feature',
      properties: { ...p },
      geometry: {
        type: 'Point',
        coordinates: [p.longitude, p.latitude]
      }
    }))
  }), [parkingData]);

  // Update highlight filter when selectedId changes
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      if (map.getLayer('highlighted-point')) {
        map.setFilter('highlighted-point', ['==', ['get', 'id'], selectedId || '']);
      }
    }
    
    if (selectedId) {
      const selected = parkingData.find(p => p.id === selectedId);
      if (selected) {
        setPopupInfo(selected);
      }
    } else {
      setPopupInfo(null);
    }
  }, [selectedId, parkingData]);

  const onMapClick = useCallback((event: any) => {
    const feature = event.features && event.features[0];
    if (feature && (feature.layer.id === 'unclustered-point' || feature.layer.id === 'highlighted-point')) {
      const parking = feature.properties as ParkingListing;
      setPopupInfo(parking);
      onSelect?.(parking.id);
    } else if (feature && feature.layer.id === 'clusters') {
      const clusterId = feature.properties.cluster_id;
      const mapboxSource = mapRef.current?.getSource('parking-spots') as mapboxgl.GeoJSONSource;

      mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom === undefined) return;

        mapRef.current?.easeTo({
          center: feature.geometry.coordinates,
          zoom: zoom,
          duration: 500
        });
      });
    } else {
        setPopupInfo(null);
        onSelect?.(null);
    }
  }, [onSelect]);

  const onMouseEnter = useCallback(() => {
    if (mapRef.current) mapRef.current.getMap().getCanvas().style.cursor = 'pointer';
  }, []);

  const onMouseLeave = useCallback(() => {
    if (mapRef.current) mapRef.current.getMap().getCanvas().style.cursor = '';
  }, []);

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-gray-200 min-h-[400px]">
      <Map
        {...viewState}
        ref={mapRef}
        onMove={evt => {
            setViewState(evt.viewState);
            onMove?.(evt.viewState);
        }}
        onClick={onMapClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        interactiveLayerIds={[clusterLayer.id!, unclusteredPointLayer.id!, highlightLayer.id!]}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        <GeolocateControl position="top-left" trackUserLocation showUserHeading />
        <FullscreenControl position="top-left" />
        <NavigationControl position="top-left" />

        <Source
          id="parking-spots"
          type="geojson"
          data={geojson as any}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
          <Layer {...highlightLayer} />
        </Source>

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => {
                setPopupInfo(null);
                onSelect?.(null);
            }}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2 min-w-[150px]">
              <h3 className="font-bold text-sm">{popupInfo.name}</h3>
              <p className="text-xs text-gray-600 mb-1">{popupInfo.address}</p>
              <div className="flex gap-1">
                <span className="text-[10px] px-1 bg-blue-100 text-blue-800 rounded">{popupInfo.type}</span>
                <span className="text-[10px] px-1 bg-green-100 text-green-800 rounded">{popupInfo.coverage}</span>
              </div>
              {popupInfo.distance !== undefined && (
                <p className="text-[10px] mt-1 font-medium">{popupInfo.distance}m away</p>
              )}
            </div>
          </Popup>
        )}
      </Map>
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-50 p-4 text-center">
            <div className="bg-white p-4 rounded shadow-lg border border-red-200">
                <p className="text-red-600 font-semibold">Mapbox Token Missing</p>
                <p className="text-sm text-gray-600">Please set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default ParkingMap;
