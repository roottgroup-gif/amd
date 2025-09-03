import { useEffect, useRef } from "react";
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

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = () => {
      // Check if Leaflet is available
      if (typeof window !== 'undefined' && (window as any).L && mapRef.current && !mapInstanceRef.current) {
        const L = (window as any).L;
        
        try {
          // Initialize map centered on Erbil, Kurdistan
          mapInstanceRef.current = L.map(mapRef.current).setView([36.1911, 44.0093], 13);
          
          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstanceRef.current);

          // Add zoom event listener for clustering
          mapInstanceRef.current.on('zoomend', updateMarkers);
          
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
      const clusters = createClusters();
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

  // Function to create clusters
  const createClusters = () => {
    const clusters: any[] = [];
    const processed = new Set<number>();
    const CLUSTER_DISTANCE = 0.02;

    properties.forEach((property, index) => {
      if (processed.has(index) || !property.latitude || !property.longitude) return;

      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);
      const cluster = [property];
      processed.add(index);

      // Find nearby properties
      properties.forEach((otherProperty, otherIndex) => {
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

  // Update markers when properties change
  useEffect(() => {
    updateMarkers();
  }, [properties]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === 'all' || value === 'any' || value === '') {
      delete newFilters[key as keyof PropertyFilters];
    } else {
      newFilters[key as keyof PropertyFilters] = value as any;
    }
    onFilterChange?.(newFilters);
  };

  return (
    <div className={className}>
      <div className="relative">
        {/* Map Container - Full Size */}
        <div className="relative h-screen" data-testid="property-map">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Filters Overlay on Map */}
          <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-[1000]">
            <div className="backdrop-blur-md rounded-lg shadow-xl p-2 sm:p-4 border border-white/20">
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-2 sm:gap-3">
                {/* Top row - Main filters */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 flex-1">
                  {/* Price Range Filter */}
                  <div className="flex-1 min-w-[120px] sm:min-w-[130px]">
                    <Select 
                      value={filters.maxPrice?.toString() || ''} 
                      onValueChange={(value) => handleFilterChange('maxPrice', value)}
                    >
                      <SelectTrigger className="h-9 border border-white/30 hover:border-blue-400 rounded-md bg-white/20 backdrop-blur-sm text-xs sm:text-sm text-blue-400">
                        <SelectValue placeholder="Any Price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Price</SelectItem>
                        <SelectItem value="200000">Under $200k</SelectItem>
                        <SelectItem value="500000">$200k - $500k</SelectItem>
                        <SelectItem value="1000000">$500k+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Property Type Filter */}
                  <div className="flex-1 min-w-[120px] sm:min-w-[130px]">
                    <Select 
                      value={filters.type || ''} 
                      onValueChange={(value) => handleFilterChange('type', value)}
                    >
                      <SelectTrigger className="h-9 border border-white/30 hover:border-blue-400 rounded-md bg-white/20 backdrop-blur-sm text-xs sm:text-sm text-blue-400">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Bedrooms Filter */}
                  <div className="flex-1 min-w-[100px] sm:min-w-[110px]">
                    <Select 
                      value={filters.bedrooms?.toString() || ''} 
                      onValueChange={(value) => handleFilterChange('bedrooms', value)}
                    >
                      <SelectTrigger className="h-9 border border-white/30 hover:border-blue-400 rounded-md bg-white/20 backdrop-blur-sm text-xs sm:text-sm text-blue-400">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Bottom row - Button and count */}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                  {/* Apply Filters Button */}
                  <Button 
                    onClick={() => onFilterChange?.(filters)}
                    className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-md transition-colors flex-shrink-0"
                    data-testid="apply-filters-button"
                  >
                    <Search className="mr-1 h-4 w-4" />
                    Apply
                  </Button>
                  
                  {/* Properties Count */}
                  <Badge className="h-9 flex items-center text-xs bg-white/20 text-blue-400 border border-white/30 backdrop-blur-sm flex-shrink-0 px-3">
                    {properties.length} Properties
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Legend Overlay on Map */}
          <div className="absolute bottom-4 left-4 right-4 z-[1000]">
            <div className="backdrop-blur-md rounded-lg shadow-xl p-3 border border-white/20">
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="text-white font-medium" style={{ color: 'white' }}>For Sale</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-white font-medium" style={{ color: 'white' }}>For Rent</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-home text-blue-600 text-sm"></i>
                    <span className="text-white" style={{ color: 'white' }}>Houses</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-building text-purple-600 text-sm"></i>
                    <span className="text-white" style={{ color: 'white' }}>Apartments</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-map-marked-alt text-orange-600 text-sm"></i>
                    <span className="text-white" style={{ color: 'white' }}>Land</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Fallback content if map fails to load */}
          {typeof window === 'undefined' || !(window as any).L ? (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Loading interactive map...</p>
                <p className="text-sm text-gray-500 mt-2">Powered by OpenStreetMap & Leaflet.js</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}