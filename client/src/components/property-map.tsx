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

    // Check if Leaflet is available
    if (typeof window !== 'undefined' && (window as any).L) {
      const L = (window as any).L;
      
      // Initialize map centered on Erbil, Kurdistan
      mapInstanceRef.current = L.map(mapRef.current).setView([36.1911, 44.0093], 13);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Update markers when properties change
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined' || !(window as any).L) return;

    const L = (window as any).L;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Group properties by proximity for clustering
    const clusters = [];
    const processed = new Set();
    const CLUSTER_DISTANCE = 0.01; // Adjust this value to change clustering sensitivity

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
        
        // Calculate distance
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
        lat: lat,
        lng: lng,
        center: cluster.length > 1 ? {
          lat: cluster.reduce((sum, p) => sum + parseFloat(p.latitude), 0) / cluster.length,
          lng: cluster.reduce((sum, p) => sum + parseFloat(p.longitude), 0) / cluster.length
        } : { lat, lng }
      });
    });

    // Create markers for each cluster
    clusters.forEach(cluster => {
      if (cluster.properties.length === 1) {
        // Single property
        const property = cluster.properties[0];
        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);
        
        // Create custom icon based on property type and listing type
        const getPropertyIcon = (type: string, listingType: string, isFeatured: boolean = false) => {
          let iconHtml = '';
          let bgColor = '';
          let borderColor = '';
          let animationClass = '';
          
          // Set colors based on listing type
          if (listingType === 'sale') {
            bgColor = '#dc2626'; // Red for sale
            borderColor = '#fef2f2'; // Light red border
          } else {
            bgColor = '#16a34a'; // Green for rent
            borderColor = '#f0fdf4'; // Light green border
          }
          
          // Add premium animation if featured
          if (isFeatured) {
            animationClass = 'premium-marker';
          }
          
          // Set icon based on property type
          if (type === 'house' || type === 'villa') {
            iconHtml = `
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
                <i class="fas fa-home" style="color: white; font-size: 18px; pointer-events: none;"></i>
                ${isFeatured ? '<div class="premium-ring"></div>' : ''}
              </div>
            `;
          } else if (type === 'apartment') {
            iconHtml = `
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
                <i class="fas fa-building" style="color: white; font-size: 18px; pointer-events: none;"></i>
                ${isFeatured ? '<div class="premium-ring"></div>' : ''}
              </div>
            `;
          } else {
            // Default for land or other types
            iconHtml = `
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
                <i class="fas fa-map-marked-alt" style="color: white; font-size: 18px; pointer-events: none;"></i>
                ${isFeatured ? '<div class="premium-ring"></div>' : ''}
              </div>
            `;
          }
          
          return L.divIcon({
            html: iconHtml,
            className: 'custom-property-marker clickable-marker',
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          });
        };
        
        const customIcon = getPropertyIcon(property.type, property.listingType, property.isFeatured);
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);

        // Add popup with property info, image, and view button
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
          className: 'custom-popup',
          closeButton: true,
          autoClose: true,
          autoPan: true
        });

        markersRef.current.push(marker);
      } else {
        // Multiple properties - create cluster marker
        const count = cluster.properties.length;
        const clusterLat = cluster.center.lat;
        const clusterLng = cluster.center.lng;
        
        // Create cluster icon
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
              position: relative;
              z-index: 200;
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
        
        const clusterMarker = L.marker([clusterLat, clusterLng], { icon: clusterIcon }).addTo(mapInstanceRef.current);
        
        // Create cluster popup with all properties
        const clusterPopupContent = `
          <div class="cluster-popup" style="width: 320px; max-width: 95vw;">
            <div class="cluster-header" style="
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white;
              padding: 12px 16px;
              margin: -8px -8px 12px -8px;
              border-radius: 12px 12px 0 0;
              font-weight: 600;
              text-align: center;
            ">
              ${count} Properties in this area
            </div>
            <div class="cluster-properties" style="max-height: 300px; overflow-y: auto;">
              ${cluster.properties.map(property => `
                <div class="cluster-property-item" style="
                  padding: 8px 0;
                  border-bottom: 1px solid #e5e7eb;
                  cursor: pointer;
                " onclick="window.viewPropertyFromMap('${property.id}')">
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
        
        clusterMarker.bindPopup(clusterPopupContent, {
          maxWidth: 350,
          className: 'custom-cluster-popup',
          closeButton: true,
          autoClose: true,
          autoPan: true
        });
        
        markersRef.current.push(clusterMarker);
      }
    });

    // Fit map to show all markers if there are any
    if (markersRef.current.length > 0 && properties.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [properties, onPropertyClick]);

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
      <Card className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Map Filters */}
        <div className="p-6 border-b border-border">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">Price Range:</label>
              <Select 
                value={filters.maxPrice?.toString() || ''} 
                onValueChange={(value) => handleFilterChange('maxPrice', value)}
              >
                <SelectTrigger className="w-40">
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
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">Property Type:</label>
              <Select 
                value={filters.type || ''} 
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-foreground">Bedrooms:</label>
              <Select 
                value={filters.bedrooms?.toString() || ''} 
                onValueChange={(value) => handleFilterChange('bedrooms', value)}
              >
                <SelectTrigger className="w-32">
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
            
            <Button 
              onClick={() => onFilterChange?.(filters)}
              className="ml-auto"
              data-testid="apply-filters-button"
            >
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>
        
        {/* Map Container */}
        <div className="relative h-96" data-testid="property-map">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Fallback content if map fails to load */}
          {typeof window === 'undefined' || !(window as any).L ? (
            <div className="absolute inset-0 bg-muted/20 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading interactive map...</p>
                <p className="text-sm text-muted-foreground mt-2">Powered by OpenStreetMap & Leaflet.js</p>
              </div>
            </div>
          ) : null}
        </div>
        
        {/* Map Legend */}
        <div className="p-4 bg-muted/30 border-t border-border">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-sm"></div>
              <span className="text-muted-foreground font-medium">For Sale</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow-sm"></div>
              <span className="text-muted-foreground font-medium">For Rent</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <i className="fas fa-home text-gray-600 text-sm"></i>
                <span className="text-muted-foreground text-xs">Houses</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-building text-gray-600 text-sm"></i>
                <span className="text-muted-foreground text-xs">Apartments</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {properties.length} Properties Shown
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
