import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Property, PropertyFilters } from "@/types";
import { Search, MapPin } from "lucide-react";

interface PropertyMapProps {
  properties: Property[];
  filters?: PropertyFilters;
  onFilterChange?: (filters: PropertyFilters) => void;
  onPropertyClick?: (property: Property) => void;
  className?: string;
}

export default function PropertyMap({ 
  properties, 
  filters = {}, 
  onFilterChange, 
  onPropertyClick,
  className 
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const currentPropertiesRef = useRef<Property[]>([]);
  
  // Local state for filters
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters || {});

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters || {});
  }, [filters]);

  // Properties are already filtered from the API, so we use them directly
  // The filtering happens on the server side when onFilterChange is called

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = () => {
      // Check if Leaflet is available
      if (typeof window !== 'undefined' && (window as any).L && mapRef.current && !mapInstanceRef.current) {
        const L = (window as any).L;
        
        try {
          // Clear any existing map first
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
          
          // Clear Leaflet ID if exists
          if ((mapRef.current as any)._leaflet_id) {
            delete (mapRef.current as any)._leaflet_id;
          }
          
          // Ensure the container is ready
          if (!mapRef.current || !mapRef.current.offsetParent) {
            // Container not ready yet, retry in a moment
            setTimeout(initializeMap, 100);
            return;
          }
          
          // Initialize map centered on Erbil, Kurdistan with custom zoom control position
          mapInstanceRef.current = L.map(mapRef.current, {
            zoomControl: false, // Disable default zoom control
            attributionControl: false // Disable attribution control
          }).setView([36.1911, 44.0093], 13);
          
          // Add styled zoom control at bottom right
          const zoomControl = L.control.zoom({
            position: 'bottomright'
          }).addTo(mapInstanceRef.current);
          
          // Style the zoom controls with blur background and circular design
          setTimeout(() => {
            const zoomButtons = document.querySelectorAll('.leaflet-control-zoom a');
            zoomButtons.forEach((button: any) => {
              button.style.cssText = `
                background: rgba(255, 255, 255, 0.15) !important;
                backdrop-filter: blur(12px) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 50% !important;
                width: 40px !important;
                height: 40px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: #1e40af !important;
                font-weight: bold !important;
                font-size: 18px !important;
                text-decoration: none !important;
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 8px 32px rgba(31, 38, 135, 0.15) !important;
                transition: all 0.3s ease !important;
                margin: 2px !important;
              `;
              
              // Add hover effects
              button.addEventListener('mouseenter', () => {
                button.style.background = 'rgba(255, 255, 255, 0.25) !important';
                button.style.transform = 'scale(1.1) !important';
                button.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 12px 40px rgba(31, 38, 135, 0.25) !important';
              });
              
              button.addEventListener('mouseleave', () => {
                button.style.background = 'rgba(255, 255, 255, 0.15) !important';
                button.style.transform = 'scale(1) !important';
                button.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 8px 32px rgba(31, 38, 135, 0.15) !important';
              });
            });
            
            // Style the zoom control container
            const zoomContainer = document.querySelector('.leaflet-control-zoom');
            if (zoomContainer) {
              (zoomContainer as any).style.cssText = `
                border: none !important;
                border-radius: 25px !important;
                box-shadow: none !important;
                background: transparent !important;
              `;
            }
          }, 100);
          
          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstanceRef.current);

          // Add zoom event listener to refresh markers on zoom
          mapInstanceRef.current.on('zoomend', () => {
            // Re-render markers using the current properties ref
            updateMarkersForProperties(currentPropertiesRef.current);
          });
          
          // Invalidate size to ensure proper rendering
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 100);
          
          console.log('Map initialized successfully');
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }
    };

    // Try to initialize immediately
    initializeMap();

    // If Leaflet is not ready, wait for it
    if (!((window as any).L)) {
      const checkLeaflet = setInterval(() => {
        if ((window as any).L) {
          clearInterval(checkLeaflet);
          initializeMap();
        }
      }, 100);

      return () => {
        clearInterval(checkLeaflet);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }
      };
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
        mapInstanceRef.current = null;
      }
      
      // Clear markers
      markersRef.current.forEach(marker => {
        try {
          if (marker && marker.remove) {
            marker.remove();
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      });
      markersRef.current = [];
    };
  }, []);

  // Resize handler for full screen
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Also invalidate size when component is first rendered with full height
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Function to update markers - always show all individual markers
  const updateMarkers = () => {
    if (!mapInstanceRef.current || typeof window === 'undefined' || !(window as any).L) return;
    
    // Don't update markers if properties array is empty (might be loading)
    if (!properties || properties.length === 0) {
      return;
    }

    const L = (window as any).L;

    // Clear existing markers safely
    markersRef.current.forEach(marker => {
      try {
        if (mapInstanceRef.current && marker) {
          mapInstanceRef.current.removeLayer(marker);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    markersRef.current = [];

    // Always show individual markers for all properties
    properties.forEach(property => {
      if (property.latitude && property.longitude) {
        createSingleMarker(property, L);
      }
    });
  };

  // Function to create clusters for given properties
  const createClustersForProperties = (propertiesToCluster: Property[]) => {
    const clusters: any[] = [];
    const processed = new Set<number>();
    const CLUSTER_DISTANCE = 0.02;

    propertiesToCluster.forEach((property, index) => {
      if (processed.has(index) || !property.latitude || !property.longitude) return;

      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);
      const cluster = [property];
      processed.add(index);

      // Find nearby properties
      propertiesToCluster.forEach((otherProperty, otherIndex) => {
        if (processed.has(otherIndex) || !otherProperty.latitude || !otherProperty.longitude) return;

        const otherLat = parseFloat(otherProperty.latitude);
        const otherLng = parseFloat(otherProperty.longitude);
        
        const distance = Math.sqrt(
          Math.pow(lat - otherLat, 2) + Math.pow(lng - otherLng, 2)
        );

        if (distance <= CLUSTER_DISTANCE) {
          cluster.push(otherProperty);
          processed.add(otherIndex);
        }
      });

      clusters.push({
        properties: cluster,
        center: {
          lat: cluster.reduce((sum, p) => sum + parseFloat(p.latitude || '0'), 0) / cluster.length,
          lng: cluster.reduce((sum, p) => sum + parseFloat(p.longitude || '0'), 0) / cluster.length
        }
      });
    });

    return clusters;
  };

  // Function to create cluster marker
  const createClusterMarker = (cluster: any, L: any) => {
    const count = cluster.properties.length;
    const { lat, lng } = cluster.center;
    
    const clusterIcon = L.divIcon({
      html: `
        <div class="cluster-marker" style="
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
          border: 4px solid white;
          cursor: pointer;
          font-weight: 700;
          color: white;
          font-size: 14px;
        ">
          ${count}
        </div>
      `,
      className: 'custom-cluster-marker',
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });
    
    const marker = L.marker([lat, lng], { icon: clusterIcon }).addTo(mapInstanceRef.current);
    
    const popupContent = `
      <div class="cluster-popup" style="width: 320px; max-width: 95vw;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 16px; margin: -8px -8px 12px -8px; border-radius: 12px 12px 0 0; font-weight: 600; text-align: center;">
          ${count} Properties in this area
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
          ${cluster.properties.map((property: any) => `
            <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; cursor: pointer;" onclick="window.viewPropertyFromMap('${property.id}')">
              <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${property.title}</div>
              <div style="font-size: 11px; color: #666; margin-bottom: 4px;">${property.address}</div>
              <div style="font-weight: 700; color: #2563eb; font-size: 12px;">
                ${property.currency === 'USD' ? '$' : property.currency}${parseFloat(property.price).toLocaleString()}${property.listingType === 'rent' ? '/mo' : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent, {
      maxWidth: 350,
      className: 'custom-cluster-popup'
    });
    
    markersRef.current.push(marker);
  };

  // Function to create individual property marker
  const createSingleMarker = (property: any, L: any) => {
    const lat = parseFloat(property.latitude || '0');
    const lng = parseFloat(property.longitude || '0');

    // Create custom icon based on property type and listing type
    const getPropertyIcon = (type: string, listingType: string, isFeatured: boolean = false) => {
      let bgColor = listingType === 'sale' ? '#dc2626' : '#16a34a';
      let borderColor = listingType === 'sale' ? '#fef2f2' : '#f0fdf4';
      let animationClass = isFeatured ? 'premium-marker' : '';
      let iconType = type === 'apartment' ? 'fa-building' : type === 'land' ? 'fa-map-marked-alt' : 'fa-home';

      return L.divIcon({
        html: `
          <div class="property-marker-icon ${animationClass}" style="
            background: ${bgColor};
            border-color: ${borderColor};
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            border: 4px solid ${borderColor};
            cursor: pointer;
            position: relative;
            z-index: 100;
          ">
            <i class="fas ${iconType}" style="color: white; font-size: 18px; pointer-events: none;"></i>
            ${isFeatured ? '<div class="premium-ring"></div>' : ''}
          </div>
        `,
        className: 'custom-property-marker clickable-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });
    };

    const customIcon = getPropertyIcon(property.type, property.listingType, property.isFeatured);
    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);

    // Add popup
    const firstImage = property.images && property.images.length > 0 ? property.images[0] : '';
    const popupContent = `
      <div class="property-popup responsive-popup">
        ${firstImage ? `
          <div class="popup-image">
            <img src="${firstImage}" alt="${property.title}" 
                 onerror="this.style.display='none'; this.parentNode.style.height='0'; this.parentNode.style.marginBottom='0';" />
          </div>
        ` : ''}
        <div class="popup-content">
          <h4 class="popup-title">${property.title}</h4>
          <p class="popup-address">${property.address}</p>
          <p class="popup-price">
            ${property.currency === 'USD' ? '$' : property.currency}${parseFloat(property.price).toLocaleString()}${property.listingType === 'rent' ? '/mo' : ''}
          </p>
          <div class="popup-details">
            ${property.bedrooms ? `<span><i class="fas fa-bed" style="color: #3b82f6; margin-right: 4px;"></i>${property.bedrooms} beds</span>` : ''} 
            ${property.bathrooms ? `<span><i class="fas fa-bath" style="color: #3b82f6; margin-right: 4px;"></i>${property.bathrooms} baths</span>` : ''}
            ${property.area ? `<span><i class="fas fa-ruler-combined" style="color: #3b82f6; margin-right: 4px;"></i>${property.area} sq ft</span>` : ''}
          </div>
          <button class="popup-button" 
                  onclick="window.viewPropertyFromMap('${property.id}')"
                  onmouseover="this.style.background='#1d4ed8'"
                  onmouseout="this.style.background='#2563eb'">
            View Property
          </button>
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent, {
      maxWidth: 350,
      minWidth: 240,
      className: 'custom-popup'
    });

    markersRef.current.push(marker);
  };

  // Update markers when properties change (from API)
  useEffect(() => {
    currentPropertiesRef.current = properties;
    updateMarkersForProperties(properties);
  }, [properties]);

  // Update markers function that accepts properties array - always show all markers
  const updateMarkersForProperties = (propertiesToShow: Property[]) => {
    if (!mapInstanceRef.current || typeof window === 'undefined' || !(window as any).L) return;
    
    // Clear existing markers safely
    markersRef.current.forEach(marker => {
      try {
        if (mapInstanceRef.current && marker) {
          mapInstanceRef.current.removeLayer(marker);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    markersRef.current = [];

    // Don't update markers if properties array is empty
    if (!propertiesToShow || propertiesToShow.length === 0) {
      return;
    }

    const L = (window as any).L;

    // Always show individual markers for all properties
    propertiesToShow.forEach(property => {
      if (property.latitude && property.longitude) {
        createSingleMarker(property, L);
      }
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    console.log(`Filter change: ${key} = ${value}`);
    const newFilters = { ...localFilters };
    
    // Handle special "clear" values
    if (value === 'any-price' || value === 'all-types' || value === 'any-bedrooms') {
      delete newFilters[key as keyof PropertyFilters];
    } else {
      // Convert values to proper types
      if (key === 'maxPrice' || key === 'bedrooms') {
        newFilters[key as keyof PropertyFilters] = parseInt(value) as any;
      } else {
        newFilters[key as keyof PropertyFilters] = value as any;
      }
    }
    
    // Always maintain the limit for map properties
    newFilters.limit = 100;
    
    setLocalFilters(newFilters);
    console.log('Updated filters:', newFilters);
    
    // Immediately trigger parent filter change to call API
    onFilterChange?.(newFilters);
  };

  return (
    <div className={className}>
      <div className="relative">
        {/* Map Container - Full Size */}
        <div className="relative h-screen" data-testid="property-map">
          <div ref={mapRef} className="w-full h-full" />
          
          
          {/* Legend Overlay on Map */}
          <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 z-[1000] transition-all duration-500 ease-out">
            <div className="p-4 md:p-5 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-sm">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-105">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex-shrink-0 shadow-lg animate-pulse"></div>
                    <span className="font-semibold text-sm text-black drop-shadow-lg">🏷️ For Sale</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-105">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex-shrink-0 shadow-lg animate-pulse"></div>
                    <span className="font-semibold text-sm text-black drop-shadow-lg">🔑 For Rent</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
                  <div className="flex items-center space-x-2 p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-105">
                    <i className="fas fa-home text-blue-500 text-sm sm:text-base flex-shrink-0 drop-shadow-lg"></i>
                    <span className="text-sm text-black font-medium drop-shadow-lg">Houses</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-105">
                    <i className="fas fa-building text-purple-500 text-sm sm:text-base flex-shrink-0 drop-shadow-lg"></i>
                    <span className="text-sm text-black font-medium drop-shadow-lg">Apartments</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/30 hover:scale-105">
                    <i className="fas fa-map-marked-alt text-orange-500 text-sm sm:text-base flex-shrink-0 drop-shadow-lg"></i>
                    <span className="text-sm text-black font-medium drop-shadow-lg">Land</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Fallback content if map fails to load */}
          {typeof window === 'undefined' || !(window as any).L ? (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center p-8 rounded-2xl bg-white/20 backdrop-blur-md shadow-2xl border border-white/30">
                <div className="relative">
                  <MapPin className="mx-auto h-16 w-16 text-blue-500 mb-6 animate-bounce drop-shadow-lg" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Loading Interactive Map</h3>
                <p className="text-gray-600 mb-4">Discovering amazing properties for you...</p>
                <div className="flex items-center justify-center space-x-1 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <p className="text-sm text-gray-500 font-medium">🗺️ Powered by OpenStreetMap & Leaflet.js</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}