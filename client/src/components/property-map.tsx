import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Property, PropertyFilters } from "@/types";
import { Search, MapPin, Navigation, X, Bed, Bath, Square, ChevronLeft, ChevronRight } from "lucide-react";

interface PropertyMapProps {
  properties: Property[];
  filters?: PropertyFilters;
  onFilterChange?: (filters: PropertyFilters) => void;
  onPropertyClick?: (property: Property) => void;
  onPropertySelect?: (property: Property) => void;
  className?: string;
}

export default function PropertyMap({ 
  properties, 
  filters = {}, 
  onFilterChange, 
  onPropertyClick,
  onPropertySelect,
  className 
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const currentPropertiesRef = useRef<Property[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  
  // Local state for filters
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters || {});
  
  // State for selected property card
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [cardAnimation, setCardAnimation] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters || {});
  }, [filters]);

  // Properties are already filtered from the API, so we use them directly
  // The filtering happens on the server side when onFilterChange is called

  // Add global slider function for popup
  useEffect(() => {
    // Define global function for changing slides in map popups
    (window as any).changeSlide = (popupId: string, direction: number) => {
      const popup = document.getElementById(popupId);
      if (!popup) return;
      
      const slides = popup.querySelectorAll('.popup-slide');
      const counter = popup.querySelector('.slide-counter');
      if (!slides.length) return;
      
      // Find current active slide
      let currentIndex = 0;
      slides.forEach((slide, index) => {
        if ((slide as HTMLElement).style.opacity === '1') {
          currentIndex = index;
        }
      });
      
      // Calculate next index
      let nextIndex = currentIndex + direction;
      if (nextIndex >= slides.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = slides.length - 1;
      
      // Hide all slides
      slides.forEach((slide) => {
        (slide as HTMLElement).style.opacity = '0';
      });
      
      // Show next slide
      (slides[nextIndex] as HTMLElement).style.opacity = '1';
      
      // Update counter
      if (counter) {
        counter.textContent = (nextIndex + 1).toString();
      }
    };
  }, []);

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
          
          // Calculate dynamic zoom limits based on viewport
          const viewportHeight = window.innerHeight;
          const minZoom = viewportHeight < 600 ? 6 : 4; // Allow more zoom out for better area coverage
          const maxZoom = 18;
          
          // Initialize map centered on Erbil, Kurdistan with zoom restrictions
          mapInstanceRef.current = L.map(mapRef.current, {
            zoomControl: false, // Disable default zoom control
            attributionControl: false, // Disable attribution control
            minZoom: minZoom, // Prevent excessive zoom out
            maxZoom: maxZoom, // Prevent excessive zoom in
            zoomSnap: 0.5, // Allow half-zoom levels for smoother experience
            zoomDelta: 0.5 // Smoother zoom steps
          }).setView([36.1911, 44.0093], 13);
          
          
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
          background: linear-gradient(135deg, #bdd479 0%, #a3c766 100%);
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
        <div style="background: linear-gradient(135deg, #bdd479 0%, #a3c766 100%); color: white; padding: 12px 16px; margin: -8px -8px 12px -8px; border-radius: 12px 12px 0 0; font-weight: 600; text-align: center;">
          ${count} Properties in this area
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
          ${cluster.properties.map((property: any) => `
            <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; cursor: pointer;" onclick="window.viewPropertyFromMap('${property.id}')">
              <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">${property.title}</div>
              <div style="font-size: 11px; color: #666; margin-bottom: 4px;">${property.address}</div>
              <div style="font-weight: 700; color: #FF7800; font-size: 12px;">
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

    // Add click event to show property card
    marker.on('click', () => {
      // Show the property card with animation
      setSelectedProperty(property);
      setCardAnimation(true);
      
      // Trigger callback
      if (onPropertySelect) {
        onPropertySelect(property);
      }
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
      // Check if the same value is already selected (toggle functionality)
      const currentValue = localFilters[key as keyof PropertyFilters];
      
      if (currentValue === value) {
        // If same value is clicked, unselect it (remove the filter)
        delete newFilters[key as keyof PropertyFilters];
        console.log(`Unselecting filter: ${key}`);
      } else {
        // Convert values to proper types and set new filter
        if (key === 'maxPrice' || key === 'bedrooms') {
          newFilters[key as keyof PropertyFilters] = parseInt(value) as any;
        } else {
          newFilters[key as keyof PropertyFilters] = value as any;
        }
      }
    }
    
    // Always maintain the limit for map properties
    newFilters.limit = 100;
    
    setLocalFilters(newFilters);
    console.log('Updated filters:', newFilters);
    
    // Immediately trigger parent filter change to call API
    onFilterChange?.(newFilters);
  };

  // Property card handlers
  const handleCloseCard = () => {
    setCardAnimation(false);
    setTimeout(() => setSelectedProperty(null), 300);
  };

  const nextImage = () => {
    if (selectedProperty && selectedProperty.images && selectedProperty.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedProperty.images.length);
    }
  };

  const prevImage = () => {
    if (selectedProperty && selectedProperty.images && selectedProperty.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedProperty.images.length) % selectedProperty.images.length);
    }
  };

  const formatPrice = (price: string, currency: string, listingType: string) => {
    const amount = parseFloat(price);
    const formattedAmount = new Intl.NumberFormat().format(amount);
    const suffix = listingType === 'rent' ? '/mo' : '';
    return `${currency === 'USD' ? '$' : currency}${formattedAmount}${suffix}`;
  };

  // Reset image index when property changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedProperty]);

  // Geolocation function
  const handleGetMyLocation = () => {
    if (!mapInstanceRef.current) return;
    
    setIsLocating(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const L = (window as any).L;
          
          if (mapInstanceRef.current && L) {
            // Smoothly fly to user's location with animation
            mapInstanceRef.current.flyTo([latitude, longitude], 15, {
              animate: true,
              duration: 2.5, // 2.5 seconds smooth animation
              easeLinearity: 0.25
            });
            
            // Add a marker for user's location
            const userLocationIcon = L.divIcon({
              html: `
                <div style="
                  background: #4285F4;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  position: relative;
                ">
                  <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 8px;
                    height: 8px;
                    background: white;
                    border-radius: 50%;
                  "></div>
                </div>
              `,
              className: 'user-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            
            // Remove any existing user location markers
            markersRef.current.forEach(marker => {
              if (marker.options && marker.options.icon && marker.options.icon.options.className === 'user-location-marker') {
                mapInstanceRef.current.removeLayer(marker);
              }
            });
            
            const userMarker = L.marker([latitude, longitude], { icon: userLocationIcon }).addTo(mapInstanceRef.current);
            userMarker.bindPopup('📍 Your Current Location');
            markersRef.current.push(userMarker);
          }
          
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
          alert('Unable to get your location. Please check your browser permissions.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setIsLocating(false);
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        {/* Map Container - Full Size */}
        <div className="relative h-screen" data-testid="property-map">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Get My Location Button */}
          <Button
            onClick={handleGetMyLocation}
            disabled={isLocating}
            className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-2xl hover:bg-white dark:hover:bg-black/95 text-black dark:text-white p-3"
            data-testid="get-location-button"
          >
            <Navigation 
              className={`h-5 w-5 ${isLocating ? 'animate-spin' : ''}`} 
              style={{color: '#FF7800'}} 
            />
          </Button>
          
          
          {/* My Location Button in Footer */}
          <Button
            onClick={handleGetMyLocation}
            disabled={isLocating}
            className="fixed bottom-20 right-6 z-[1001] bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-black/95 text-black dark:text-white p-3 rounded-full transition-all duration-300"
            data-testid="footer-location-button"
          >
            <Navigation 
              className={`h-6 w-6 ${isLocating ? 'animate-spin' : ''}`} 
              style={{color: '#FF7800'}} 
            />
          </Button>

          {/* Legend Overlay on Map */}
          <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 z-[1000] transition-all duration-500 ease-out">
            <div className="p-4 md:p-5 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-sm">
                <div className={`flex items-center space-x-2 sm:space-x-3 p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                      localFilters.listingType === 'sale' 
                        ? 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-600' 
                        : 'bg-white/90 dark:bg-black/90 border-white/20 hover:bg-white dark:hover:bg-black hover:border-white/30'
                    }`}
                     onClick={() => handleFilterChange('listingType', 'sale')}>
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex-shrink-0 shadow-lg ${localFilters.listingType === 'sale' ? 'animate-pulse' : ''}`}></div>
                  <span className={`font-semibold text-sm drop-shadow-lg ${localFilters.listingType === 'sale' ? 'text-red-700 dark:text-red-300' : 'text-black dark:text-white'}`}>🏷️ For Sale</span>
                </div>
                <div className={`flex items-center space-x-2 sm:space-x-3 p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                      localFilters.listingType === 'rent' 
                        ? 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-600' 
                        : 'bg-white/90 dark:bg-black/90 border-white/20 hover:bg-white dark:hover:bg-black hover:border-white/30'
                    }`}
                     onClick={() => handleFilterChange('listingType', 'rent')}>
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex-shrink-0 shadow-lg ${localFilters.listingType === 'rent' ? 'animate-pulse' : ''}`}></div>
                  <span className={`font-semibold text-sm drop-shadow-lg ${localFilters.listingType === 'rent' ? 'text-green-700 dark:text-green-300' : 'text-black dark:text-white'}`}>🔑 For Rent</span>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
                  <div className={`flex items-center space-x-2 p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                        localFilters.type === 'house' 
                          ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600' 
                          : 'bg-white/90 dark:bg-black/90 border-white/20 hover:bg-white dark:hover:bg-black hover:border-white/30'
                      }`}
                       onClick={() => handleFilterChange('type', 'house')}>
                    <i className="fas fa-home text-sm sm:text-base flex-shrink-0 drop-shadow-lg" style={{color: '#FF7800'}}></i>
                    <span className={`text-sm font-medium drop-shadow-lg ${localFilters.type === 'house' ? 'text-orange-700 dark:text-orange-300' : 'text-black dark:text-white'}`}>Houses</span>
                  </div>
                  <div className={`flex items-center space-x-2 p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                        localFilters.type === 'apartment' 
                          ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600' 
                          : 'bg-white/90 dark:bg-black/90 border-white/20 hover:bg-white dark:hover:bg-black hover:border-white/30'
                      }`}
                       onClick={() => handleFilterChange('type', 'apartment')}>
                    <i className="fas fa-building text-sm sm:text-base flex-shrink-0 drop-shadow-lg" style={{color: '#FF7800'}}></i>
                    <span className={`text-sm font-medium drop-shadow-lg ${localFilters.type === 'apartment' ? 'text-orange-700 dark:text-orange-300' : 'text-black dark:text-white'}`}>Apartments</span>
                  </div>
                  <div className={`flex items-center space-x-2 p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                        localFilters.type === 'land' 
                          ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600' 
                          : 'bg-white/90 dark:bg-black/90 border-white/20 hover:bg-white dark:hover:bg-black hover:border-white/30'
                      }`}
                       onClick={() => handleFilterChange('type', 'land')}>
                    <i className="fas fa-map-marked-alt text-sm sm:text-base flex-shrink-0 drop-shadow-lg" style={{color: '#FF7800'}}></i>
                    <span className={`text-sm font-medium drop-shadow-lg ${localFilters.type === 'land' ? 'text-orange-700 dark:text-orange-300' : 'text-black dark:text-white'}`}>Land</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Fallback content if map fails to load */}
          {typeof window === 'undefined' || !(window as any).L ? (
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center p-8 rounded-2xl bg-white/20 backdrop-blur-md shadow-2xl border border-white/30">
                <div className="relative">
                  <MapPin className="mx-auto h-16 w-16 mb-6 animate-bounce drop-shadow-lg" style={{color: '#FF7800'}} />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full animate-ping opacity-75" style={{backgroundColor: '#FF7800'}}></div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Loading Interactive Map</h3>
                <p className="text-gray-600 mb-4">Discovering amazing properties for you...</p>
                <div className="flex items-center justify-center space-x-1 mb-4">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#FF7800'}}></div>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{animationDelay: '0.2s', backgroundColor: '#FF7800'}}></div>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{animationDelay: '0.4s', backgroundColor: '#FF7800'}}></div>
                </div>
                <p className="text-sm text-gray-500 font-medium">🗺️ Powered by OpenStreetMap & Leaflet.js</p>
              </div>
            </div>
          ) : null}
        </div>
        
        {/* Animated Property Card */}
        {selectedProperty && (
          <div 
            className={`fixed inset-x-0 bottom-0 z-[1001] transform transition-all duration-500 ease-out ${
              cardAnimation ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
            style={{ 
              background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="mx-4 mb-4 md:mx-8 md:mb-8">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-w-md mx-auto">
                {/* Property Image with Navigation */}
                <div className="relative h-48 overflow-hidden">
                  {selectedProperty.images && selectedProperty.images.length > 0 ? (
                    <>
                      <img 
                        src={selectedProperty.images[currentImageIndex]}
                        alt={selectedProperty.title}
                        className="w-full h-48 object-cover transition-all duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600';
                        }}
                      />
                      
                      {/* Navigation arrows - only show if multiple images */}
                      {selectedProperty.images.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 h-8 w-8"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 h-8 w-8"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          
                          {/* Image counter */}
                          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                            {currentImageIndex + 1} / {selectedProperty.images.length}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseCard}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  {/* Listing Type Badge */}
                  <Badge 
                    className={`absolute top-2 left-2 ${
                      selectedProperty.listingType === 'sale' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {selectedProperty.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                  </Badge>
                </div>
                
                {/* Property Details */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {selectedProperty.title}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                    <MapPin className="h-4 w-4 mr-1 text-red-500" />
                    <span className="text-sm">{selectedProperty.address}</span>
                  </div>
                  
                  <div className="text-2xl font-bold text-orange-600 mb-3">
                    {formatPrice(selectedProperty.price, selectedProperty.currency, selectedProperty.listingType)}
                  </div>
                  
                  {/* Property Features */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {selectedProperty.bedrooms && (
                      <span className="flex items-center bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                        <Bed className="h-4 w-4 mr-1 text-orange-600" />
                        {selectedProperty.bedrooms} beds
                      </span>
                    )}
                    {selectedProperty.bathrooms && (
                      <span className="flex items-center bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                        <Bath className="h-4 w-4 mr-1 text-orange-600" />
                        {selectedProperty.bathrooms} baths
                      </span>
                    )}
                    {selectedProperty.area && (
                      <span className="flex items-center bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                        <Square className="h-4 w-4 mr-1 text-orange-600" />
                        {selectedProperty.area.toLocaleString()} sq ft
                      </span>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <Button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open(`/property/${selectedProperty.id}`, '_blank');
                      }
                    }}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    View Property
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}