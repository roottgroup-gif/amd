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
  
  // Local state for filters
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters || {});

  // Filter properties based on current filters
  const filteredProperties = properties.filter(property => {
    // Price filter
    if (localFilters.maxPrice) {
      const maxPrice = parseInt(localFilters.maxPrice.toString());
      const propertyPrice = parseFloat(property.price || '0');
      if (propertyPrice > maxPrice) return false;
    }

    // Type filter
    if (localFilters.type && localFilters.type !== 'all') {
      if (property.type !== localFilters.type.toString()) return false;
    }

    // Bedrooms filter
    if (localFilters.bedrooms && localFilters.bedrooms > 0) {
      const minBedrooms = localFilters.bedrooms;
      const propertyBedrooms = property.bedrooms || 0;
      if (propertyBedrooms < minBedrooms) return false;
    }

    return true;
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = () => {
      // Check if Leaflet is available
      if (typeof window !== 'undefined' && (window as any).L && mapRef.current && !mapInstanceRef.current) {
        const L = (window as any).L;
        
        try {
          // Clear any existing map first
          if ((mapRef.current as any)._leaflet_id) {
            (mapRef.current as any)._leaflet_id = null;
          }
          
          // Initialize map centered on Erbil, Kurdistan
          mapInstanceRef.current = L.map(mapRef.current).setView([36.1911, 44.0093], 13);
          
          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstanceRef.current);

          // Add zoom event listener for clustering
          mapInstanceRef.current.on('zoomend', () => updateMarkersForProperties(filteredProperties));
          
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
        mapInstanceRef.current.remove();
      }
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

  // Function to update markers based on zoom level
  const updateMarkers = () => {
    if (!mapInstanceRef.current || typeof window === 'undefined' || !(window as any).L) return;
    
    // Don't update markers if properties array is empty (might be loading)
    if (!properties || properties.length === 0) {
      return;
    }

    const L = (window as any).L;
    const zoom = mapInstanceRef.current.getZoom();

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Clustering threshold - show clusters when zoomed out
    const CLUSTER_ZOOM_THRESHOLD = 12;
    const shouldCluster = zoom < CLUSTER_ZOOM_THRESHOLD;

    if (shouldCluster) {
      // Create clusters when zoomed out
      const clusters = createClustersForProperties(properties);
      clusters.forEach(cluster => {
        if (cluster.properties.length === 1) {
          createSingleMarker(cluster.properties[0], L);
        } else {
          createClusterMarker(cluster, L);
        }
      });
    } else {
      // Show individual markers when zoomed in
      properties.forEach(property => {
        if (property.latitude && property.longitude) {
          createSingleMarker(property, L);
        }
      });
    }
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
            ${property.bedrooms ? `<span>${property.bedrooms} beds</span>` : ''} 
            ${property.bathrooms ? `<span>• ${property.bathrooms} baths</span>` : ''}
            ${property.area ? `<span>• ${property.area} sq ft</span>` : ''}
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

  // Update markers when filtered properties change
  useEffect(() => {
    updateMarkersForProperties(filteredProperties);
  }, [filteredProperties]);

  // Update markers function that accepts properties array
  const updateMarkersForProperties = (propertiesToShow: Property[]) => {
    if (!mapInstanceRef.current || typeof window === 'undefined' || !(window as any).L) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Don't update markers if properties array is empty
    if (!propertiesToShow || propertiesToShow.length === 0) {
      return;
    }

    const L = (window as any).L;
    const zoom = mapInstanceRef.current.getZoom();

    // Clustering threshold - show clusters when zoomed out
    const CLUSTER_ZOOM_THRESHOLD = 12;
    const shouldCluster = zoom < CLUSTER_ZOOM_THRESHOLD;

    if (shouldCluster) {
      // Create clusters when zoomed out
      const clusters = createClustersForProperties(propertiesToShow);
      clusters.forEach(cluster => {
        if (cluster.properties.length === 1) {
          createSingleMarker(cluster.properties[0], L);
        } else {
          createClusterMarker(cluster, L);
        }
      });
    } else {
      // Show individual markers when zoomed in
      propertiesToShow.forEach(property => {
        if (property.latitude && property.longitude) {
          createSingleMarker(property, L);
        }
      });
    }
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
    setLocalFilters(newFilters);
    console.log('Updated filters:', newFilters);
  };

  return (
    <div className={className}>
      <div className="relative">
        {/* Map Container - Full Size */}
        <div className="relative h-screen" data-testid="property-map">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Filters Overlay on Map */}
          <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-[1000] transition-all duration-500 ease-out">
            <div className="backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 md:p-6 hover:shadow-3xl transition-all duration-300">
              {/* All elements in one row with enhanced spacing */}
              <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                {/* Price Range Filter */}
                <div className="flex-1 min-w-[120px] sm:min-w-[140px] transition-all duration-300">
                  <Select 
                    value={localFilters.maxPrice?.toString() || 'any-price'} 
                    onValueChange={(value) => handleFilterChange('maxPrice', value)}
                  >
                    <SelectTrigger className="h-10 sm:h-11 border-0 rounded-xl bg-white/15 backdrop-blur-2xl text-sm sm:text-base text-blue-700 font-semibold w-full transition-all duration-300 hover:bg-white/25 focus:bg-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_32px_rgba(31,38,135,0.15)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_40px_rgba(31,38,135,0.25)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_16px_48px_rgba(59,130,246,0.3)] ring-1 ring-white/20 hover:ring-white/30 focus:ring-blue-400/50">
                      <SelectValue placeholder="💰 Any Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any-price">Any Price</SelectItem>
                      <SelectItem value="200000">Under $200k</SelectItem>
                      <SelectItem value="500000">Under $500k</SelectItem>
                      <SelectItem value="1000000">Under $1M</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Property Type Filter */}
                <div className="flex-1 min-w-[120px] sm:min-w-[140px] transition-all duration-300">
                  <Select 
                    value={localFilters.type || 'all-types'} 
                    onValueChange={(value) => handleFilterChange('type', value)}
                  >
                    <SelectTrigger className="h-10 sm:h-11 border-0 rounded-xl bg-white/15 backdrop-blur-2xl text-sm sm:text-base text-blue-700 font-semibold w-full transition-all duration-300 hover:bg-white/25 focus:bg-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_32px_rgba(31,38,135,0.15)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_40px_rgba(31,38,135,0.25)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_16px_48px_rgba(59,130,246,0.3)] ring-1 ring-white/20 hover:ring-white/30 focus:ring-blue-400/50">
                      <SelectValue placeholder="🏠 All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-types">All Types</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Bedrooms Filter */}
                <div className="flex-1 min-w-[100px] sm:min-w-[120px] transition-all duration-300">
                  <Select 
                    value={localFilters.bedrooms?.toString() || 'any-bedrooms'} 
                    onValueChange={(value) => handleFilterChange('bedrooms', value)}
                  >
                    <SelectTrigger className="h-10 sm:h-11 border-0 rounded-xl bg-white/15 backdrop-blur-2xl text-sm sm:text-base text-blue-700 font-semibold w-full transition-all duration-300 hover:bg-white/25 focus:bg-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_32px_rgba(31,38,135,0.15)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_40px_rgba(31,38,135,0.25)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_16px_48px_rgba(59,130,246,0.3)] ring-1 ring-white/20 hover:ring-white/30 focus:ring-blue-400/50">
                      <SelectValue placeholder="🛏️ Beds" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any-bedrooms">Any</SelectItem>
                      <SelectItem value="1">1+ Bedrooms</SelectItem>
                      <SelectItem value="2">2+ Bedrooms</SelectItem>
                      <SelectItem value="3">3+ Bedrooms</SelectItem>
                      <SelectItem value="4">4+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Apply Filters Button */}
                <Button 
                  onClick={() => {
                    console.log('Search button clicked with filters:', localFilters);
                    onFilterChange?.(localFilters);
                  }}
                  className="h-10 sm:h-11 px-4 sm:px-6 bg-gradient-to-br from-blue-500/80 via-blue-600/70 to-indigo-600/80 backdrop-blur-2xl text-white text-sm sm:text-base font-bold rounded-xl transition-all duration-300 flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_32px_rgba(59,130,246,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_12px_48px_rgba(59,130,246,0.4)] hover:bg-gradient-to-br hover:from-blue-400/90 hover:via-blue-500/80 hover:to-indigo-500/90 transform hover:scale-105 hover:-translate-y-0.5 active:scale-95 ring-1 ring-white/30 hover:ring-white/40"
                  data-testid="apply-filters-button"
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Go</span>
                </Button>
                
                {/* Properties Count */}
                <Badge className="h-10 sm:h-11 flex items-center text-sm sm:text-base bg-gradient-to-br from-emerald-400/15 via-green-500/10 to-blue-500/15 text-blue-700 backdrop-blur-2xl flex-shrink-0 px-4 sm:px-5 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_32px_rgba(16,185,129,0.1)] font-bold transition-all duration-300 hover:bg-gradient-to-br hover:from-emerald-400/25 hover:via-green-500/20 hover:to-blue-500/25 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_12px_40px_rgba(16,185,129,0.2)] ring-1 ring-white/20 hover:ring-white/30 hover:scale-105 hover:-translate-y-0.5">
                  <span className="hidden sm:inline">📊 {filteredProperties.length} Properties</span>
                  <span className="sm:hidden">📊 {filteredProperties.length}</span>
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Legend Overlay on Map */}
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 z-[1000] transition-all duration-500 ease-out">
            <div className="backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 md:p-5 hover:shadow-3xl transition-all duration-300">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-sm">
                <div className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-xl bg-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:scale-105">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex-shrink-0 shadow-lg animate-pulse"></div>
                  <span className="font-semibold text-sm text-black drop-shadow-lg">🏷️ For Sale</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-xl bg-white/10 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:scale-105">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex-shrink-0 shadow-lg animate-pulse"></div>
                  <span className="font-semibold text-sm text-black drop-shadow-lg">🔑 For Rent</span>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
                  <div className="flex items-center space-x-2 p-2 transition-all duration-300 hover:scale-105">
                    <i className="fas fa-home text-blue-500 text-sm sm:text-base flex-shrink-0 drop-shadow-lg"></i>
                    <span className="text-sm text-black font-medium drop-shadow-lg">Houses</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 transition-all duration-300 hover:scale-105">
                    <i className="fas fa-building text-purple-500 text-sm sm:text-base flex-shrink-0 drop-shadow-lg"></i>
                    <span className="text-sm text-black font-medium drop-shadow-lg">Apartments</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 transition-all duration-300 hover:scale-105">
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