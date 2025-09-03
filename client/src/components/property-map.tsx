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

    // Add new markers
    properties.forEach(property => {
      if (property.latitude && property.longitude) {
        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);
        
        // Create marker with custom color based on listing type
        const markerColor = property.listingType === 'sale' ? '#2563eb' : '#059669'; // Blue for sale, green for rent
        
        const marker = L.circleMarker([lat, lng], {
          radius: 8,
          fillColor: markerColor,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(mapInstanceRef.current);

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
          maxWidth: 300,
          className: 'custom-popup'
        });

        markersRef.current.push(marker);
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
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-muted-foreground">For Sale</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
              <span className="text-muted-foreground">For Rent</span>
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
