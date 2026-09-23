import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { SRI_SUMANGALA_CENTER } from '../data/schools';

interface MapOverlayProps {
  residenceLocation: { lat: number; lng: number } | null;
  radius: number | null;
}

export function MapOverlay({ residenceLocation, radius }: MapOverlayProps) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    // Clean up previous overlays
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!residenceLocation || radius === null) return;

    // Draw Polyline
    polylineRef.current = new google.maps.Polyline({
      map,
      path: [
        { lat: SRI_SUMANGALA_CENTER.lat, lng: SRI_SUMANGALA_CENTER.lng },
        residenceLocation,
      ],
      strokeColor: '#e9b949',
      strokeOpacity: 0.9,
      strokeWeight: 3,
    });

    // Draw Circle
    circleRef.current = new google.maps.Circle({
      map,
      center: { lat: SRI_SUMANGALA_CENTER.lat, lng: SRI_SUMANGALA_CENTER.lng },
      radius,
      strokeColor: '#f3cf7a',
      strokeOpacity: 0.85,
      strokeWeight: 2,
      fillColor: '#e9b949',
      fillOpacity: 0.08,
    });

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, residenceLocation, radius]);

  return null;
}
