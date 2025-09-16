import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n';

// Reverse geocoding function using Nominatim (OpenStreetMap)
const reverseGeocode = async (lat: number, lng: number): Promise<LocationData> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding failed');
    }
    
    const data = await response.json();
    
    // Extract address components
    const address = data.display_name || '';
    const addressParts = data.address || {};
    
    // Build a clean address string
    const addressComponents = [];
    if (addressParts.house_number) addressComponents.push(addressParts.house_number);
    if (addressParts.road) addressComponents.push(addressParts.road);
    if (addressParts.neighbourhood) addressComponents.push(addressParts.neighbourhood);
    
    const cleanAddress = addressComponents.length > 0 
      ? addressComponents.join(' ')
      : (addressParts.road || addressParts.suburb || address.split(',')[0] || '');
    
    const city = addressParts.city || 
                 addressParts.town || 
                 addressParts.village || 
                 addressParts.municipality || 
                 addressParts.state_district || '';
    
    const country = addressParts.country || '';
    
    return {
      lat,
      lng,
      address: cleanAddress,
      city,
      country
    };
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return { lat, lng };
  }
};

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  country?: string;
}

interface LocationSelectionMapProps {
  onLocationSelect: (data: LocationData) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  className?: string;
}

export default function LocationSelectionMap({ 
  onLocationSelect, 
  selectedLocation, 
  className = '' 
}: LocationSelectionMapProps) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let checkLeafletInterval: NodeJS.Timeout | null = null;
    let timeoutRef: NodeJS.Timeout | null = null;

    // Initialize the map
    const initMap = () => {
      if (typeof window !== 'undefined' && (window as any).L && mapRef.current) {
        const L = (window as any).L;
        
        try {
          // Ensure container is ready
          if (!mapRef.current.offsetParent) {
            setTimeout(initMap, 100);
            return;
          }

          // Center on Kurdistan/Iraq region
          const map = L.map(mapRef.current).setView([36.1911, 44.0094], 8);

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Add click event to map
          map.on('click', async (e: any) => {
            try {
              const { lat, lng } = e.latlng;
              
              // Remove existing marker
              if (markerRef.current) {
                map.removeLayer(markerRef.current);
              }
              
              // Add new marker with loading popup
              markerRef.current = L.marker([lat, lng]).addTo(map);
              markerRef.current.bindPopup('Getting address...').openPopup();
              
              // Perform reverse geocoding
              const locationData = await reverseGeocode(lat, lng);
              
              // Update marker popup with address
              if (locationData.address) {
                markerRef.current.setPopupContent(`📍 ${locationData.address}`);
              }
              
              // Call the callback with full location data
              onLocationSelect(locationData);
            } catch (error) {
              console.warn('Error handling map click:', error);
              // Fallback: still call with basic location data
              onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
            }
          });

          mapInstanceRef.current = map;
          setIsMapLoaded(true);

          // Invalidate size to ensure proper rendering
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 100);

        } catch (error) {
          console.error('Error initializing location selection map:', error);
          setIsMapLoaded(false);
        }
      }
    };

    // Check if Leaflet is already loaded
    if ((window as any).L) {
      initMap();
    } else {
      // Wait for Leaflet to load
      checkLeafletInterval = setInterval(() => {
        if ((window as any).L) {
          if (checkLeafletInterval) {
            clearInterval(checkLeafletInterval);
            checkLeafletInterval = null;
          }
          initMap();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      timeoutRef = setTimeout(() => {
        if (checkLeafletInterval) {
          clearInterval(checkLeafletInterval);
          checkLeafletInterval = null;
        }
        console.warn('Leaflet failed to load within 10 seconds');
      }, 10000);
    }

    // Cleanup function
    return () => {
      if (checkLeafletInterval) {
        clearInterval(checkLeafletInterval);
      }
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
      
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error cleaning up location selection map:', error);
        }
        mapInstanceRef.current = null;
      }
      
      if (markerRef.current) {
        markerRef.current = null;
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
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      )}
    </div>
  );
}