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

    // Draw Polyline between Residence (Circle Center) and Sri Sumangala College (Radius Vector)
    polylineRef.current = new google.maps.Polyline({
      map,
      path: [
        residenceLocation,
        { lat: SRI_SUMANGALA_CENTER.lat, lng: SRI_SUMANGALA_CENTER.lng },
      ],
      strokeColor: '#10b981',
      strokeOpacity: 0.95,
      strokeWeight: 3,
    });

    // Draw Circle ALWAYS centered at applicant entering location (Residence) with radius = distance to Sri Sumangala College
    circleRef.current = new google.maps.Circle({
      map,
      center: residenceLocation, // Round's middle is the entering location
      radius,
      strokeColor: '#059669',
      strokeOpacity: 0.9,
      strokeWeight: 2.5,
      fillColor: '#10b981',
      fillOpacity: 0.1,
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
