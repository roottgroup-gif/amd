import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PropertyWithAgent, PropertyFilters } from "@shared/schema";
import { Search, MapPin, Navigation } from "lucide-react";

interface PropertyMapProps {
  properties: PropertyWithAgent[];
  filters?: PropertyFilters;
  onFilterChange?: (filters: PropertyFilters) => void;
  onPropertyClick?: (property: PropertyWithAgent) => void;
  onPropertySelect?: (property: PropertyWithAgent) => void;
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
  const currentPropertiesRef = useRef<PropertyWithAgent[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Local state for filters
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters || {});

  // Check for dark mode and update markers when theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      const newIsDarkMode = document.documentElement.classList.contains('dark');
      setIsDarkMode(newIsDarkMode);
      
      // Re-render markers when theme changes to update their styling
      if (currentPropertiesRef.current.length > 0) {
        updateMarkersForProperties(currentPropertiesRef.current);
      }
    };
    
    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

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
      try {
        const popup = document.getElementById(popupId);
        if (!popup) return;
        
        const slides = popup.querySelectorAll('.popup-slide');
        const counter = popup.querySelector('.slide-counter');
        if (!slides || slides.length === 0) return;
        
        // Find current active slide
        let currentIndex = 0;
        slides.forEach((slide, index) => {
          if (slide && (slide as HTMLElement).style.opacity === '1') {
            currentIndex = index;
          }
        });
        
        // Calculate next index
        let nextIndex = currentIndex + direction;
        if (nextIndex >= slides.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = slides.length - 1;
        
        // Hide all slides
        slides.forEach((slide) => {
          if (slide) {
            (slide as HTMLElement).style.opacity = '0';
          }
        });
        
        // Show next slide
        if (slides[nextIndex]) {
          (slides[nextIndex] as HTMLElement).style.opacity = '1';
        }
        
        // Update counter
        if (counter) {
          counter.textContent = (nextIndex + 1).toString();
        }
      } catch (error) {
        console.warn('Error in changeSlide function:', error);
      }
    };

    // Cleanup global function on unmount
    return () => {
      if ((window as any).changeSlide) {
        delete (window as any).changeSlide;
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
  const createClustersForProperties = (propertiesToCluster: PropertyWithAgent[]) => {
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
    
    // Get theme-aware colors
    const isDark = document.documentElement.classList.contains('dark');
    const bgGradient = isDark 
      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    const shadowColor = isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(5, 150, 105, 0.4)';
    const borderColor = '#ffffff';
    
    const clusterIcon = L.divIcon({
      html: `
        <div class="cluster-marker" style="
          background: ${bgGradient};
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px ${shadowColor}, 0 0 0 2px ${borderColor};
          border: 3px solid ${borderColor};
          cursor: pointer;
          font-weight: 700;
          color: white;
          font-size: 14px;
          position: relative;
          z-index: 1000;
          transition: all 0.2s ease;
        "
        onmouseover="this.style.transform='scale(1.1)'"
        onmouseout="this.style.transform='scale(1)'">
          <i class="fas fa-home" style="margin-right: 4px; font-size: 12px;"></i>${count}
        </div>
      `,
      className: 'custom-cluster-marker',
      iconSize: [56, 56],
      iconAnchor: [28, 28]
    });
    
    const marker = L.marker([lat, lng], { icon: clusterIcon }).addTo(mapInstanceRef.current);
    
    const popupBg = isDark ? '#1f2937' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#000000';
    const subTextColor = isDark ? '#d1d5db' : '#666666';
    const popupBorderColor = isDark ? '#374151' : '#e5e7eb';
    
    const popupContent = `
      <div class="cluster-popup" style="width: 320px; max-width: 95vw; background: ${popupBg}; color: ${textColor};">
        <div style="background: linear-gradient(135deg, #bdd479 0%, #a3c766 100%); color: white; padding: 12px 16px; margin: -8px -8px 12px -8px; border-radius: 12px 12px 0 0; font-weight: 600; text-align: center;">
          ${count} Properties in this area
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
          ${cluster.properties.map((property: any) => `
            <div style="padding: 8px 0; border-bottom: 1px solid ${popupBorderColor}; cursor: pointer; color: ${textColor};" onclick="window.viewPropertyFromMap('${property.id}')">
              <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: ${textColor};">${property.title}</div>
              <div style="font-size: 11px; color: ${subTextColor}; margin-bottom: 4px;">${property.address}</div>
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
      // Get theme-aware colors
      const isDark = document.documentElement.classList.contains('dark');
      
      // Main colors for sale/rent with better contrast
      let bgColor = listingType === 'sale' ? '#dc2626' : '#059669';
      let markerBorderColor = '#ffffff';
      let shadowColor = listingType === 'sale' 
        ? (isDark ? 'rgba(220, 38, 38, 0.4)' : 'rgba(220, 38, 38, 0.3)')
        : (isDark ? 'rgba(5, 150, 105, 0.4)' : 'rgba(5, 150, 105, 0.3)');
        
      let animationClass = isFeatured ? 'premium-marker' : '';
      let iconType = type === 'apartment' ? 'fa-building' : type === 'land' ? 'fa-map-marked-alt' : type === 'villa' ? 'fa-university' : 'fa-home';

      return L.divIcon({
        html: `
          <div class="property-marker-icon ${animationClass}" style="
            background: ${bgColor};
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 16px ${shadowColor}, 0 0 0 2px ${markerBorderColor};
            border: 3px solid ${markerBorderColor};
            cursor: pointer;
            position: relative;
            z-index: 1000;
            transition: all 0.2s ease;
          "
          onmouseover="this.style.transform='scale(1.1)'; this.style.zIndex='1001'"
          onmouseout="this.style.transform='scale(1)'; this.style.zIndex='1000'">
            <i class="fas ${iconType}" style="color: white; font-size: 18px; pointer-events: none;"></i>
            ${isFeatured ? '<div class="premium-ring" style="position: absolute; top: -4px; left: -4px; right: -4px; bottom: -4px; border-radius: 50%; border: 2px solid #fbbf24; animation: pulse 2s infinite;"></div>' : ''}
          </div>
        `,
        className: 'custom-property-marker clickable-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });
    };

    const customIcon = getPropertyIcon(property.type, property.listingType, property.isFeatured);
    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);

    // Add popup with image slider
    const images = property.images && property.images.length > 0 ? property.images : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'];
    const hasMultipleImages = images.length > 1;
    const popupId = `popup-${property.id}`;
    
    const isDark = document.documentElement.classList.contains('dark');
    const popupBg = isDark ? '#1f2937' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#000000';
    const subTextColor = isDark ? '#d1d5db' : '#666666';
    
    const popupContent = `
      <div class="property-popup responsive-popup" id="${popupId}" style="background: ${popupBg}; color: ${textColor};">
        ${images.length > 0 ? `
          <div class="popup-image-container" style="position: relative;">
            <div class="popup-image-slider" style="position: relative; height: 150px; overflow: hidden;">
              ${images.map((img: string, index: number) => `
                <img src="${img}" alt="${property.title} - Image ${index + 1}" 
                     class="popup-slide" 
                     style="
                       width: 100%; 
                       height: 150px; 
                       object-fit: cover; 
                       position: absolute; 
                       top: 0; 
                       left: 0;
                       opacity: ${index === 0 ? '1' : '0'};
                       transition: opacity 0.3s ease;
                     "
                     data-slide-index="${index}"
                     onerror="this.style.display='none';" />
              `).join('')}
            </div>
            ${hasMultipleImages ? `
              <button onclick="changeSlide('${popupId}', -1)" 
                      style="
                        position: absolute; 
                        left: 8px; 
                        top: 50%; 
                        transform: translateY(-50%);
                        background: rgba(0,0,0,0.5); 
                        color: white; 
                        border: none; 
                        border-radius: 50%; 
                        width: 30px; 
                        height: 30px; 
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        z-index: 1000;
                      "
                      onmouseover="this.style.background='rgba(0,0,0,0.7)'"
                      onmouseout="this.style.background='rgba(0,0,0,0.5)'">‹</button>
              <button onclick="changeSlide('${popupId}', 1)" 
                      style="
                        position: absolute; 
                        right: 8px; 
                        top: 50%; 
                        transform: translateY(-50%);
                        background: rgba(0,0,0,0.5); 
                        color: white; 
                        border: none; 
                        border-radius: 50%; 
                        width: 30px; 
                        height: 30px; 
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        z-index: 1000;
                      "
                      onmouseover="this.style.background='rgba(0,0,0,0.7)'"
                      onmouseout="this.style.background='rgba(0,0,0,0.5)'">›</button>
              <div style="
                position: absolute; 
                bottom: 8px; 
                right: 8px; 
                background: rgba(0,0,0,0.7); 
                color: white; 
                padding: 4px 8px; 
                border-radius: 12px; 
                font-size: 12px;
                z-index: 1000;
              ">
                <span class="slide-counter">1</span> / ${images.length}
              </div>
            ` : ''}
          </div>
        ` : ''}
        <div class="popup-content" style="padding: 16px; background: ${popupBg};">
          <h4 class="popup-title" style="color: ${textColor}; font-weight: 600; font-size: 16px; margin-bottom: 8px;">${property.title}</h4>
          <p class="popup-address" style="color: ${subTextColor}; font-size: 12px; margin-bottom: 8px;">${property.address}</p>
          <p class="popup-price" style="color: #FF7800; font-weight: 700; font-size: 18px; margin-bottom: 12px;">
            ${property.currency === 'USD' ? '$' : property.currency}${parseFloat(property.price).toLocaleString()}${property.listingType === 'rent' ? '/mo' : ''}
          </p>
          <div class="popup-details" style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; font-size: 12px; color: ${subTextColor};">
            ${property.bedrooms ? `<span style="color: ${subTextColor};"><i class="fas fa-bed" style="color: #FF7800; margin-right: 4px;"></i>${property.bedrooms} beds</span>` : ''} 
            ${property.bathrooms ? `<span style="color: ${subTextColor};"><i class="fas fa-bath" style="color: #FF7800; margin-right: 4px;"></i>${property.bathrooms} baths</span>` : ''}
            ${property.area ? `<span style="color: ${subTextColor};"><i class="fas fa-ruler-combined" style="color: #FF7800; margin-right: 4px;"></i>${property.area} sq ft</span>` : ''}
          </div>
          ${(() => {
            // Priority: Customer contact (from inquiries) > Property contact phone > Agent phone
            const customerContact = property.customerContact;
            let contactPhone, contactName;
            
            if (customerContact && customerContact.phone) {
              contactPhone = customerContact.phone;
              contactName = customerContact.name;
            } else if (property.contactPhone) {
              contactPhone = property.contactPhone;
              contactName = property.agent ? `${property.agent.firstName || ''} ${property.agent.lastName || ''}`.trim() || 'Agent' : 'Owner';
            } else if (property.agent && property.agent.phone) {
              contactPhone = property.agent.phone;
              contactName = property.agent ? `${property.agent.firstName || ''} ${property.agent.lastName || ''}`.trim() || 'Agent' : 'Owner';
            }
            
            if (contactPhone) {
              // Format phone number for display (remove spaces and format cleanly)
              const displayPhone = contactPhone.replace(/\s+/g, '');
              
              const isCustomer = customerContact && customerContact.phone;
              const bgColor = isCustomer ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 211, 102, 0.1)';
              const borderColor = isCustomer ? '#3b82f6' : '#25D366';
              const iconColor = isCustomer ? '#3b82f6' : '#25D366';
              const contactType = isCustomer ? 'Customer' : 'Agent';
              
              return `
                <div style="margin-bottom: 12px; padding: 8px; background: ${bgColor}; border-radius: 8px; border-left: 3px solid ${borderColor};">
                  <div style="color: ${subTextColor}; font-size: 11px; display: flex; align-items: center;">
                    <i class="fas fa-phone" style="color: ${iconColor}; margin-right: 6px;"></i>
                    ${displayPhone}
                  </div>
                </div>
              `;
            }
            return '';
          })()}
          <div class="popup-buttons" style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="popup-button" 
                    onclick="window.viewPropertyFromMap('${property.id}')"
                    onmouseover="this.style.background='#e56600'"
                    onmouseout="this.style.background='#FF7800'"
                    style="flex: 1; min-width: 100px;">
              View Property
            </button>
            ${(() => {
              // Priority: Customer contact (from inquiries) > Property contact phone > Agent phone
              const customerContact = property.customerContact;
              let contactPhone, contactName, isCustomer = false;
              
              if (customerContact && customerContact.phone) {
                contactPhone = customerContact.phone;
                contactName = customerContact.name;
                isCustomer = true;
              } else if (property.contactPhone) {
                contactPhone = property.contactPhone;
                contactName = property.agent ? `${property.agent.firstName || ''} ${property.agent.lastName || ''}`.trim() || 'Agent' : 'Owner';
              } else if (property.agent && property.agent.phone) {
                contactPhone = property.agent.phone;
                contactName = property.agent ? `${property.agent.firstName || ''} ${property.agent.lastName || ''}`.trim() || 'Agent' : 'Owner';
              }
              
              if (contactPhone) {
                const cleanPhone = contactPhone.replace(/[^+0-9]/g, '');
                // Format phone number for display (remove spaces and format cleanly)
                const displayPhone = contactPhone.replace(/\s+/g, '');
                const callBtnColor = isCustomer ? '#3b82f6' : '#16a34a';
                const callBtnHoverColor = isCustomer ? '#2563eb' : '#0c7b00';
                const whatsappBtnColor = '#25D366';
                const whatsappBtnHoverColor = '#128C7E';
                const contactType = isCustomer ? 'Customer' : 'Agent';
                
                return `
                  <button class="popup-button" 
                          onclick="window.open('tel:${contactPhone}', '_self')"
                          onmouseover="this.style.background='${callBtnHoverColor}'"
                          onmouseout="this.style.background='${callBtnColor}'"
                          style="background: ${callBtnColor}; flex: 0 0 40px; width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center;"
                          title="Call ${contactType} - ${contactName} (${displayPhone})">
                    <i class="fas fa-phone" style="color: white;"></i>
                  </button>
                  <button class="popup-button" 
                          onclick="window.open('https://wa.me/${cleanPhone}?text=Hi, I\\'m interested in this property: ${encodeURIComponent(property.title)} - ${property.currency === 'USD' ? '$' : property.currency}${parseFloat(property.price).toLocaleString()}', '_blank')"
                          onmouseover="this.style.background='${whatsappBtnHoverColor}'"
                          onmouseout="this.style.background='${whatsappBtnColor}'"
                          style="background: ${whatsappBtnColor}; flex: 0 0 40px; width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center;"
                          title="WhatsApp ${contactType} - ${contactName} (${displayPhone})">
                    <i class="fab fa-whatsapp" style="color: white;"></i>
                  </button>
                `;
              } else {
                return `<span style="color: ${subTextColor}; font-size: 12px; font-style: italic;">Contact info not available</span>`;
              }
            })()}
          </div>
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent, {
      maxWidth: 350,
      minWidth: 240,
      className: 'custom-popup'
    });

    // Add click event without zoom behavior
    marker.on('click', () => {
      // Trigger callback without zoom
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
  const updateMarkersForProperties = (propertiesToShow: PropertyWithAgent[]) => {
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

          {/* Legend Overlay on Map */}
          <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 z-[1000] transition-all duration-500 ease-out">
            <div className="p-4 md:p-5 transition-all duration-300">
              <div className="flex items-center justify-between gap-3 sm:gap-4 md:gap-6">
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
                          localFilters.type === 'villa' 
                            ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600' 
                            : 'bg-white/90 dark:bg-black/90 border-white/20 hover:bg-white dark:hover:bg-black hover:border-white/30'
                        }`}
                         onClick={() => handleFilterChange('type', 'villa')}>
                      <i className="fas fa-university text-sm sm:text-base flex-shrink-0 drop-shadow-lg" style={{color: '#FF7800'}}></i>
                      <span className={`text-sm font-medium drop-shadow-lg ${localFilters.type === 'villa' ? 'text-orange-700 dark:text-orange-300' : 'text-black dark:text-white'}`}>Villas</span>
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
                {/* Get My Location Icon Button - Positioned on the right */}
                <Button
                  onClick={handleGetMyLocation}
                  disabled={isLocating}
                  className="p-2 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white dark:bg-white border-gray-300 dark:border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-100 flex-shrink-0"
                  data-testid="footer-location-button"
                >
                  <Navigation 
                    className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} 
                    style={{color: '#FF7800'}} 
                  />
                </Button>
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
      </div>
    </div>
  );
}