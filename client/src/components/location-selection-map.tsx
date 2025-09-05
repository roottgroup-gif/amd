import { useEffect, useRef, useState } from 'react';

interface LocationSelectionMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  className?: string;
}

export default function LocationSelectionMap({ 
  onLocationSelect, 
  selectedLocation, 
  className = '' 
}: LocationSelectionMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const initMap = () => {
      if (typeof window !== 'undefined' && (window as any).L) {
        const L = (window as any).L;
        
        // Center on Kurdistan/Iraq region
        const map = L.map(mapRef.current).setView([36.1911, 44.0094], 8);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add click event to map
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          
          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }
          
          // Add new marker
          markerRef.current = L.marker([lat, lng]).addTo(map);
          
          // Call the callback
          onLocationSelect(lat, lng);
        });

        mapInstanceRef.current = map;
        setIsMapLoaded(true);
      }
    };

    // Check if Leaflet is already loaded
    if ((window as any).L) {
      initMap();
    } else {
      // Wait for Leaflet to load
      const checkLeaflet = setInterval(() => {
        if ((window as any).L) {
          clearInterval(checkLeaflet);
          initMap();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkLeaflet), 10000);
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onLocationSelect]);

  // Update marker when selectedLocation changes externally
  useEffect(() => {
    if (mapInstanceRef.current && selectedLocation && isMapLoaded) {
      const L = (window as any).L;
      
      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }
      
      // Add new marker at selected location
      markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng])
        .addTo(mapInstanceRef.current);
      
      // Center map on the selected location
      mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lng], 13);
    }
  }, [selectedLocation, isMapLoaded]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {/* Overlay instructions */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border z-10 max-w-xs">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Click to Select Location</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Click anywhere on the map to mark your property's location
        </p>
      </div>

      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}