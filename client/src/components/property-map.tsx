import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PropertyWithAgent, PropertyFilters } from "@shared/schema";
import { Search, MapPin, Navigation } from "lucide-react";
import {
  useAddToFavorites,
  useRemoveFromFavorites,
  useIsFavorite,
} from "@/hooks/use-properties";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";

interface PropertyMapProps {
  properties: PropertyWithAgent[];
  filters?: PropertyFilters;
  onFilterChange?: (filters: PropertyFilters) => void;
  onPropertyClick?: (property: PropertyWithAgent) => void;
  onPropertySelect?: (property: PropertyWithAgent) => void;
  userId?: string;
  className?: string;
}

export default function PropertyMap({
  properties,
  filters = {},
  onFilterChange,
  onPropertyClick,
  onPropertySelect,
  userId,
  className,
}: PropertyMapProps) {
  const { t, getLocalized, language } = useTranslation();

  // Add conditional spacing for Arabic and Kurdish languages
  const isRTL = language === "ar" || language === "kur";
  const spacingFilter = isRTL
    ? "space-x-3 sm:space-x-4"
    : "space-x-2 sm:space-x-3";
  const spacingType = isRTL ? "space-x-3" : "space-x-2";
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const currentPropertiesRef = useRef<PropertyWithAgent[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Favorites hooks
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();
  const queryClient = useQueryClient();

  // Local state for filters
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(
    filters || {},
  );
  const isLocalUpdate = useRef(false);
  const clickGuard = useRef<number | null>(null);

  // Helper function to get localized property title with fallback
  const getPropertyTitle = (property: any) => {
    return getLocalized(property.title, property.title || "Untitled Property");
  };

  // Check for dark mode and update markers when theme changes
  useEffect(() => {
    const checkDarkMode = () => {
      const newIsDarkMode = document.documentElement.classList.contains("dark");
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
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Sync local filters with prop changes, but don't overwrite local updates
  useEffect(() => {
    if (isLocalUpdate.current) {
      isLocalUpdate.current = false;
      return;
    }
    setLocalFilters(filters || {});
  }, [filters]);

  // Properties are already filtered from the API, so we use them directly
  // The filtering happens on the server side when onFilterChange is called

  // Add global functions for popup interactions
  useEffect(() => {
    // Define global function for changing slides in map popups
    (window as any).changeSlide = (popupId: string, direction: number) => {
      try {
        const popup = document.getElementById(popupId);
        if (!popup) return;

        const slides = popup.querySelectorAll(".popup-slide");
        const counter = popup.querySelector(".slide-counter");
        if (!slides || slides.length === 0) return;

        // Find current active slide
        let currentIndex = 0;
        slides.forEach((slide, index) => {
          if (slide && (slide as HTMLElement).style.opacity === "1") {
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
            (slide as HTMLElement).style.opacity = "0";
          }
        });

        // Show next slide
        if (slides[nextIndex]) {
          (slides[nextIndex] as HTMLElement).style.opacity = "1";
        }

        // Update counter
        if (counter) {
          counter.textContent = (nextIndex + 1).toString();
        }
      } catch (error) {
        console.warn("Error in changeSlide function:", error);
      }
    };

    // Define global function for handling favorites from map popups
    (window as any).toggleFavoriteFromMap = async (propertyId: string) => {
      if (!userId) {
        console.warn("User not logged in, cannot toggle favorite");
        return;
      }

      try {
        // Check current favorite status using the correct query key format
        const currentData = queryClient.getQueryData([
          "/api/favorites/check",
          { userId, propertyId },
        ]) as { isFavorite?: boolean } | undefined;
        const isFavorite = currentData?.isFavorite || false;

        if (isFavorite) {
          await removeFromFavorites.mutateAsync({ userId, propertyId });
        } else {
          await addToFavorites.mutateAsync({ userId, propertyId });
        }

        // Update the heart button immediately
        const heartButton = document.querySelector(
          `#heart-btn-${propertyId}`,
        ) as HTMLElement;
        if (heartButton) {
          const newIsFavorite = !isFavorite;
          heartButton.innerHTML = newIsFavorite
            ? '<i class="fas fa-heart" style="color: #ef4444; font-size: 14px;"></i>'
            : '<i class="far fa-heart" style="color: #6b7280; font-size: 14px;"></i>';
          heartButton.style.backgroundColor = newIsFavorite
            ? "#fee2e2"
            : "#f3f4f6";
        }
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
      }
    };

    // Define global function for viewing property details from map popup
    (window as any).viewPropertyFromMap = (propertyId: string) => {
      try {
        // Find the property to get its slug
        const property = properties.find(p => p.id === propertyId);
        const identifier = property?.slug || propertyId;
        
        // Navigate to property detail page using multiple approaches
        console.log("Navigating to property:", propertyId, "using identifier:", identifier);

        // First try: Direct window navigation
        if (window.location) {
          window.location.href = `/property/${identifier}`;
          return;
        }

        // Fallback: Open in new window if direct navigation fails
        window.open(`/property/${identifier}`, "_self");
      } catch (error) {
        console.error("Navigation failed:", error);
        // Last resort: Open in new tab with the identifier
        const property = properties.find(p => p.id === propertyId);
        const identifier = property?.slug || propertyId;
        window.open(`/property/${identifier}`, "_blank");
      }
    };

    // Define global function for zooming to property from cluster popup with smooth motion
    (window as any).zoomToPropertyFromCluster = (
      propertyId: string,
      lat: string,
      lng: string,
    ) => {
      if (mapInstanceRef.current && lat && lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const L = (window as any).L;

        // Add visual feedback - highlight the clicked item temporarily
        const clickedItem = document.querySelector(
          `[onclick*="${propertyId}"]`,
        ) as HTMLElement;
        if (clickedItem) {
          clickedItem.style.background =
            "linear-gradient(135deg, #FF7800 0%, #e56600 100%)";
          clickedItem.style.color = "white";
          clickedItem.style.transform = "scale(1.02)";
          clickedItem.style.transition = "all 0.3s ease";

          // Reset after animation
          setTimeout(() => {
            if (clickedItem) {
              clickedItem.style.background = "transparent";
              clickedItem.style.color = "";
              clickedItem.style.transform = "scale(1)";
            }
          }, 1500);
        }

        // Close any open popups first with animation
        mapInstanceRef.current.closePopup();

        // First, zoom out slightly to show movement, then zoom to target
        const currentZoom = mapInstanceRef.current.getZoom();
        const targetZoom = Math.max(16, currentZoom + 2);

        // Create smooth multi-stage animation
        setTimeout(() => {
          if (mapInstanceRef.current) {
            // Stage 1: Smooth pan and zoom with easing
            mapInstanceRef.current.flyTo([latitude, longitude], targetZoom, {
              animate: true,
              duration: 1.5,
              easeLinearity: 0.1,
            });

            // Stage 2: Add a temporary pulse marker to show the target
            setTimeout(() => {
              if (mapInstanceRef.current && L) {
                const pulseMarker = L.divIcon({
                  html: `
                    <div style="
                      width: 60px;
                      height: 60px;
                      border-radius: 50%;
                      background: radial-gradient(circle, rgba(255, 120, 0, 0.8) 0%, rgba(255, 120, 0, 0.4) 50%, transparent 70%);
                      animation: pulseAnimation 2s ease-out;
                      pointer-events: none;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">
                      <div style="
                        width: 20px;
                        height: 20px;
                        background: #FF7800;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                      "></div>
                    </div>
                    <style>
                      @keyframes pulseAnimation {
                        0% { transform: scale(0.5); opacity: 0; }
                        50% { transform: scale(1.2); opacity: 1; }
                        100% { transform: scale(1); opacity: 0.8; }
                      }
                    </style>
                  `,
                  className: "pulse-marker",
                  iconSize: [60, 60],
                  iconAnchor: [30, 30],
                });

                const tempMarker = L.marker([latitude, longitude], {
                  icon: pulseMarker,
                }).addTo(mapInstanceRef.current);

                // Remove the pulse marker after animation
                setTimeout(() => {
                  if (tempMarker && mapInstanceRef.current) {
                    mapInstanceRef.current.removeLayer(tempMarker);
                  }
                }, 2000);
              }
            }, 800);
          }
        }, 200);

        // Optional: trigger property selection callback if available
        if (onPropertySelect) {
          const property = properties.find((p) => p.id === propertyId);
          if (property) {
            setTimeout(() => {
              onPropertySelect(property);
            }, 1000);
          }
        }
      }
    };

    // Cleanup global functions on unmount
    return () => {
      if ((window as any).changeSlide) {
        delete (window as any).changeSlide;
      }
      if ((window as any).toggleFavoriteFromMap) {
        delete (window as any).toggleFavoriteFromMap;
      }
      if ((window as any).viewPropertyFromMap) {
        delete (window as any).viewPropertyFromMap;
      }
      if ((window as any).zoomToPropertyFromCluster) {
        delete (window as any).zoomToPropertyFromCluster;
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initializeMap = () => {
      // Check if Leaflet is available
      if (
        typeof window !== "undefined" &&
        (window as any).L &&
        mapRef.current &&
        !mapInstanceRef.current
      ) {
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
            zoomDelta: 0.5, // Smoother zoom steps
          }).setView([36.1911, 44.0093], 13);

          // Add OpenStreetMap tiles
          L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          ).addTo(mapInstanceRef.current);

          // Add zoom event listener to refresh markers on zoom
          mapInstanceRef.current.on("zoomend", () => {
            // Re-render markers using the current properties ref
            updateMarkersForProperties(currentPropertiesRef.current);
          });

          // Invalidate size to ensure proper rendering
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          }, 100);

          console.log("Map initialized successfully");
        } catch (error) {
          console.error("Error initializing map:", error);
        }
      }
    };

    // Try to initialize immediately
    initializeMap();

    // If Leaflet is not ready, wait for it
    if (!(window as any).L) {
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
          console.warn("Error cleaning up map:", error);
        }
        mapInstanceRef.current = null;
      }

      // Clear markers
      markersRef.current.forEach((marker) => {
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

    window.addEventListener("resize", handleResize);

    // Also invalidate size when component is first rendered with full height
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Function to create zoom-based clusters
  const createZoomBasedClusters = (
    propertiesToCluster: PropertyWithAgent[],
    zoomLevel: number,
  ) => {
    // Enhanced zoom-based clustering with better grouping when zooming out
    // If zoomed very far out (zoom < 7), group by country
    if (zoomLevel < 7) {
      return createCountryBasedClusters(propertiesToCluster);
    }
    // If zoomed out (zoom < 9), group by city
    else if (zoomLevel < 9) {
      return createCityBasedClusters(propertiesToCluster);
    }
    // If moderately zoomed out (zoom < 12), use larger distance clustering
    else if (zoomLevel < 12) {
      return createDistanceBasedClusters(propertiesToCluster, zoomLevel);
    }
    // If zoomed in more, use precise distance-based clustering
    else {
      return createDistanceBasedClusters(propertiesToCluster, zoomLevel);
    }
  };

  // Function to create country-based clusters
  const createCountryBasedClusters = (
    propertiesToCluster: PropertyWithAgent[],
  ) => {
    const countryGroups: { [key: string]: PropertyWithAgent[] } = {};

    // Group properties by country
    propertiesToCluster.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      // Use country as grouping key, fallback to 'Unknown Country'
      const country = property.country || "Unknown Country";

      if (!countryGroups[country]) {
        countryGroups[country] = [];
      }
      countryGroups[country].push(property);
    });

    // Convert country groups to clusters
    return Object.entries(countryGroups).map(([country, properties]) => ({
      properties,
      country,
      clusterType: "country",
      center: {
        lat:
          properties.reduce(
            (sum, p) => sum + parseFloat(p.latitude || "0"),
            0,
          ) / properties.length,
        lng:
          properties.reduce(
            (sum, p) => sum + parseFloat(p.longitude || "0"),
            0,
          ) / properties.length,
      },
    }));
  };

  // Function to create city-based clusters
  const createCityBasedClusters = (
    propertiesToCluster: PropertyWithAgent[],
  ) => {
    const cityGroups: { [key: string]: PropertyWithAgent[] } = {};

    // Group properties by city
    propertiesToCluster.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      // Use city as grouping key, fallback to 'Unknown City'
      const city = property.city || "Unknown City";

      if (!cityGroups[city]) {
        cityGroups[city] = [];
      }
      cityGroups[city].push(property);
    });

    // Convert city groups to clusters
    return Object.entries(cityGroups).map(([city, properties]) => ({
      properties,
      city,
      clusterType: "city",
      center: {
        lat:
          properties.reduce(
            (sum, p) => sum + parseFloat(p.latitude || "0"),
            0,
          ) / properties.length,
        lng:
          properties.reduce(
            (sum, p) => sum + parseFloat(p.longitude || "0"),
            0,
          ) / properties.length,
      },
    }));
  };

  // Function to create distance-based clusters
  const createDistanceBasedClusters = (
    propertiesToCluster: PropertyWithAgent[],
    zoomLevel: number,
  ) => {
    const clusters: any[] = [];
    const processed = new Set<number>();
    // Enhanced cluster distance based on zoom level for better grouping
    const CLUSTER_DISTANCE =
      zoomLevel > 15
        ? 0.003 // Very close clustering for high zoom
        : zoomLevel > 13
          ? 0.005 // Close clustering
          : zoomLevel > 11
            ? 0.01 // Medium clustering
            : zoomLevel > 9
              ? 0.03 // Larger clustering for medium zoom
              : 0.05; // Very large clustering for lower zoom

    propertiesToCluster.forEach((property, index) => {
      if (processed.has(index) || !property.latitude || !property.longitude)
        return;

      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);
      const cluster = [property];
      processed.add(index);

      // Find nearby properties
      propertiesToCluster.forEach((otherProperty, otherIndex) => {
        if (
          processed.has(otherIndex) ||
          !otherProperty.latitude ||
          !otherProperty.longitude
        )
          return;

        const otherLat = parseFloat(otherProperty.latitude);
        const otherLng = parseFloat(otherProperty.longitude);

        const distance = Math.sqrt(
          Math.pow(lat - otherLat, 2) + Math.pow(lng - otherLng, 2),
        );

        if (distance <= CLUSTER_DISTANCE) {
          cluster.push(otherProperty);
          processed.add(otherIndex);
        }
      });

      clusters.push({
        properties: cluster,
        center: {
          lat:
            cluster.reduce((sum, p) => sum + parseFloat(p.latitude || "0"), 0) /
            cluster.length,
          lng:
            cluster.reduce(
              (sum, p) => sum + parseFloat(p.longitude || "0"),
              0,
            ) / cluster.length,
        },
      });
    });

    return clusters;
  };

  // Helper function to get property type icon
  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case "house":
        return "fas fa-home";
      case "apartment":
        return "fas fa-building";
      case "villa":
        return "fas fa-university";
      case "land":
        return "fas fa-mountain";
      default:
        return "fas fa-home";
    }
  };

  // Helper function to analyze cluster property types
  const analyzeClusterTypes = (properties: PropertyWithAgent[]) => {
    const typeCount: { [key: string]: number } = {};
    properties.forEach((prop) => {
      const type = prop.type || "house";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    return typeCount;
  };

  // Function to create cluster marker
  const createClusterMarker = (
    cluster: any,
    L: any,
    isCityCluster: boolean = false,
  ) => {
    const count = cluster.properties.length;
    const { lat, lng } = cluster.center;

    // Always use orange background for cluster markers regardless of theme
    const isDark = document.documentElement.classList.contains("dark");
    const bgGradient = "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"; // Consistent orange gradient
    const shadowColor = "rgba(249, 115, 22, 0.4)"; // Consistent orange shadow
    const borderColor = "#ffffff";

    // Analyze property types in this cluster
    const typeAnalysis = analyzeClusterTypes(cluster.properties);
    const hasActiveFilter = localFilters.type && localFilters.type !== "all";

    // If there's an active filter, check if this cluster contains that type
    const hasFilteredType =
      hasActiveFilter && typeAnalysis[localFilters.type!] > 0;

    // Determine which icon to show based on filter and cluster content
    let iconToShow = "fas fa-home"; // default
    if (hasActiveFilter && hasFilteredType) {
      // Show the filtered type icon if this cluster contains that type
      iconToShow = getPropertyTypeIcon(localFilters.type!);
    } else if (Object.keys(typeAnalysis).length === 1) {
      // If all properties in cluster are same type, show that type's icon
      const singleType = Object.keys(typeAnalysis)[0];
      iconToShow = getPropertyTypeIcon(singleType);
    }

    // Determine cluster size and styling based on count and type
    const isLargeCluster = count > 10;
    const clusterSize = isCityCluster ? (isLargeCluster ? 60 : 50) : 44;
    const fontSize = isCityCluster
      ? isLargeCluster
        ? "12px"
        : "11px"
      : "14px";
    const iconSize = isCityCluster ? "10px" : "12px";

    const clusterIcon = L.divIcon({
      html: `
        <div class="cluster-marker" style="
          background: ${bgGradient};
          width: ${clusterSize}px;
          height: ${clusterSize}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: ${isCityCluster ? "column" : "row"};
          box-shadow: 0 10px 30px ${shadowColor}, 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.2);
          border: 3px solid ${borderColor};
          cursor: pointer;
          font-weight: 700;
          color: white;
          font-size: ${fontSize};
          position: relative;
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          transform: translateZ(0) rotateX(8deg) rotateY(8deg);
          transform-style: preserve-3d;
        "
        onmouseover="this.style.transform='scale(1.2) translateZ(15px) rotateX(15deg) rotateY(15deg)'; this.style.boxShadow='0 20px 50px ${shadowColor}, 0 12px 25px rgba(0,0,0,0.3), inset 0 3px 0 rgba(255,255,255,0.3)';"
        onmouseout="this.style.transform='translateZ(0) rotateX(8deg) rotateY(8deg)'; this.style.boxShadow='0 10px 30px ${shadowColor}, 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.2)';">
          ${
            cluster.clusterType === "country"
              ? (() => {
                  if (hasActiveFilter && hasFilteredType) {
                    // Show only the filtered type icon for country clusters
                    return `<i class="${iconToShow}" style="font-size: 12px; margin-bottom: 2px; color: white;"></i>
                        <div style="font-size: 10px; line-height: 1; color: white;">${count}</div>`;
                  } else {
                    // Show all icons when no filter is active
                    const uniqueTypes = Object.keys(typeAnalysis);
                    const iconsToShow =
                      uniqueTypes.length <= 4
                        ? uniqueTypes
                        : uniqueTypes.slice(0, 4);
                    const gridCols =
                      iconsToShow.length === 1
                        ? "1fr"
                        : iconsToShow.length === 2
                          ? "1fr 1fr"
                          : "1fr 1fr";
                    return `<div style="display: grid; grid-template-columns: ${gridCols}; gap: 1px; margin-bottom: 2px;">
                        ${iconsToShow.map((type) => `<i class="${getPropertyTypeIcon(type)}" style="font-size: 8px; color: white;"></i>`).join("")}
                        </div>
                        <div style="font-size: 10px; line-height: 1; color: white;">${count}</div>`;
                  }
                })()
              : cluster.clusterType === "city"
                ? `<i class="fas fa-city" style="font-size: ${iconSize}; margin-bottom: 2px; color: white;"></i>
             <div style="font-size: 10px; line-height: 1; color: white;">${count}</div>`
                : `<i class="${iconToShow}" style="margin-right: 4px; font-size: ${iconSize}; color: white;"></i><span style="color: white;">${count}</span>`
          }
        </div>
      `,
      className: "custom-cluster-marker",
      iconSize: [clusterSize, clusterSize],
      iconAnchor: [clusterSize / 2, clusterSize / 2],
    });

    const marker = L.marker([lat, lng], { icon: clusterIcon }).addTo(
      mapInstanceRef.current,
    );

    const popupBg = isDark ? "#1f2937" : "#ffffff";
    const textColor = isDark ? "#ffffff" : "#000000";
    const subTextColor = isDark ? "#d1d5db" : "#666666";
    const popupBorderColor = isDark ? "#374151" : "#e5e7eb";

    let popupTitle;
    if (cluster.clusterType === "country" && cluster.country) {
      popupTitle = `${count} ${t('map.propertiesIn')} ${cluster.country}`;
    } else if (cluster.clusterType === "city" && cluster.city) {
      popupTitle = `${count} ${t('map.propertiesIn')} ${cluster.city}`;
    } else {
      popupTitle = `${count} ${t('map.propertiesInThisArea')}`;
    }

    const popupContent = `
      <div class="cluster-popup responsive-cluster-popup" style="
        width: 100%; 
        max-width: min(400px, 90vw); 
        min-width: min(280px, 85vw); 
        background: ${popupBg}; 
        color: ${textColor}; 
        border-radius: 12px; 
        box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
        transform: translateZ(15px) rotateX(3deg);
        transform-style: preserve-3d;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        overflow: hidden;
      ">
        <div style="
          background: linear-gradient(135deg, #FF7800 0%, #e56600 100%); 
          color: white; 
          padding: clamp(12px, 4vw, 16px); 
          margin: 0; 
          border-radius: 12px 12px 0 0; 
          font-weight: 600; 
          text-align: center; 
          font-size: clamp(13px, 3vw, 15px);
          letter-spacing: 0.3px;
          word-wrap: break-word;
          border-bottom: 1px solid rgba(255, 120, 0, 0.2);
        ">
          ${popupTitle}
        </div>
        <div style="
          max-height: min(350px, 60vh); 
          overflow-y: auto; 
          padding: clamp(6px, 2vw, 8px); 
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 transparent;
        ">
          <style>
            .cluster-popup::-webkit-scrollbar { width: 6px; }
            .cluster-popup::-webkit-scrollbar-track { background: transparent; }
            .cluster-popup::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 3px; }
            .cluster-popup::-webkit-scrollbar-thumb:hover { background: #a0aec0; }
          </style>
          ${cluster.properties
            .map((property: any) => {
              const propertyImage =
                property.images && property.images.length > 0
                  ? property.images[0]
                  : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop&crop=center";

              return `
                <div style="
                  display: flex; 
                  gap: clamp(8px, 2vw, 12px); 
                  padding: clamp(8px, 2vw, 12px); 
                  border-bottom: 1px solid ${popupBorderColor}; 
                  cursor: pointer; 
                  color: ${textColor}; 
                  border-radius: 8px;
                  transition: background-color 0.2s ease;
                  margin-bottom: clamp(4px, 1vw, 8px);
                " 
                onclick="window.zoomToPropertyFromCluster('${property.id}', ${property.latitude}, ${property.longitude})"
                onmouseover="this.style.backgroundColor='${isDark ? "#374151" : "#f8fafc"}'"
                onmouseout="this.style.backgroundColor='transparent'">
                  
                  <div style="
                    width: clamp(60px, 15vw, 80px); 
                    height: clamp(45px, 12vw, 60px); 
                    border-radius: 6px; 
                    overflow: hidden; 
                    flex-shrink: 0;
                    background: #e2e8f0;
                  ">
                    <img src="${propertyImage}" 
                         alt="${getPropertyTitle(property)}" 
                         style="
                           width: 100%; 
                           height: 100%; 
                           object-fit: cover;
                         " 
                         onerror="this.src='https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop&crop=center';" />
                  </div>
                  
                  <div style="flex: 1; min-width: 0;">
                    <div style="
                      font-weight: 600; 
                      font-size: clamp(12px, 3vw, 14px); 
                      margin-bottom: 4px; 
                      color: ${textColor};
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      line-height: 1.3;
                    ">${getPropertyTitle(property)}</div>
                    
                    <div style="
                      font-size: clamp(10px, 2.5vw, 12px); 
                      color: ${subTextColor}; 
                      margin-bottom: 6px;
                      white-space: nowrap;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      line-height: 1.3;
                    ">${property.address}</div>
                    
                    <div style="
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      margin-bottom: 4px;
                    ">
                      <div style="
                        font-weight: 700; 
                        color: #FF7800; 
                        font-size: clamp(11px, 3vw, 13px);
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        line-height: 1.3;
                      ">
                        <span>${property.currency === "USD" ? "$" : property.currency}${parseFloat(property.price).toLocaleString()}</span>
                        ${property.listingType === "rent" ? `<span style="font-size: clamp(9px, 2.5vw, 11px); font-weight: 500;">${t('property.perMonth')}</span>` : ""}
                      </div>
                      <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 3px;
                        padding: 2px 6px;
                        border-radius: 12px;
                        font-size: clamp(8px, 2vw, 10px);
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        ${
                          property.listingType === "rent"
                            ? "background: rgba(34, 197, 94, 0.15); color: #059669; border: 1px solid rgba(34, 197, 94, 0.3);"
                            : "background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3);"
                        }
                      ">
                        ${
                          property.listingType === "rent"
                            ? `<span style="color: #059669;"></span><span>${t("filter.forRent")}</span>`
                            : `<span style="color: #dc2626;"></span><span>${t("filter.forSale")}</span>`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;

    // Add cluster marker to map
    marker.addTo(mapInstanceRef.current);

    marker.bindPopup(popupContent, {
      maxWidth: 350,
      className: "custom-cluster-popup",
    });

    markersRef.current.push(marker);
  };

  // Helper function to get favorite status for popup
  const getFavoriteStatus = (propertyId: string) => {
    if (!userId) return false;
    const favoriteData = queryClient.getQueryData([
      "/api/favorites/check",
      { userId, propertyId },
    ]) as { isFavorite?: boolean } | undefined;
    return favoriteData?.isFavorite || false;
  };

  // Function to create individual property marker
  const createSingleMarker = (property: any, L: any) => {
    const lat = parseFloat(property.latitude || "0");
    const lng = parseFloat(property.longitude || "0");

    // Create custom icon based on property type and listing type
    const getPropertyIcon = (
      type: string,
      listingType: string,
      isFeatured: boolean = false,
      hasWave: boolean = false,
    ) => {
      // Get theme-aware colors
      const isDark = document.documentElement.classList.contains("dark");

      // Main colors for sale/rent with better contrast
      let bgColor = listingType === "sale" ? "#dc2626" : "#059669";
      let markerBorderColor = "#ffffff";
      let shadowColor =
        listingType === "sale"
          ? isDark
            ? "rgba(220, 38, 38, 0.4)"
            : "rgba(220, 38, 38, 0.3)"
          : isDark
            ? "rgba(5, 150, 105, 0.4)"
            : "rgba(5, 150, 105, 0.3)";

      let animationClass = isFeatured ? "premium-marker" : "";
      let iconType =
        type === "apartment"
          ? "fa-building"
          : type === "land"
            ? "fa-map-marked-alt"
            : type === "villa"
              ? "fa-university"
              : "fa-home";

      // Premium wave animation circles
      const waveAnimation = hasWave
        ? `
        <div class="wave-circle" style="
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          border-radius: 50%;
          border: 3px solid #F59E0B;
          animation: wave-pulse 2s ease-in-out infinite;
        "></div>
        <div class="wave-circle" style="
          position: absolute;
          top: -16px;
          left: -16px;
          right: -16px;
          bottom: -16px;
          border-radius: 50%;
          border: 2px solid #F59E0B;
          animation: wave-pulse 2s ease-in-out infinite 0.5s;
          opacity: 0.7;
        "></div>
        <div class="wave-circle" style="
          position: absolute;
          top: -24px;
          left: -24px;
          right: -24px;
          bottom: -24px;
          border-radius: 50%;
          border: 1px solid #F59E0B;
          animation: wave-pulse 2s ease-in-out infinite 1s;
          opacity: 0.4;
        "></div>
        <style>
          @keyframes wave-pulse {
            0% {
              transform: scale(0.8);
              opacity: 1;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
        </style>
      `
        : "";

      return L.divIcon({
        html: `
          <div class="property-marker-icon ${animationClass}" style="
            background: ${bgColor};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 25px ${shadowColor}, 0 4px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2);
            border: 3px solid ${markerBorderColor};
            cursor: pointer;
            position: relative;
            z-index: 1000;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateZ(0) rotateX(5deg) rotateY(5deg);
            transform-style: preserve-3d;
          "
          onmouseover="this.style.transform='scale(1.15) translateZ(10px) rotateX(10deg) rotateY(10deg)'; this.style.zIndex='1001'; this.style.boxShadow='0 15px 35px ${shadowColor}, 0 8px 15px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.3)';"
          onmouseout="this.style.transform='translateZ(0) rotateX(5deg) rotateY(5deg)'; this.style.zIndex='1000'; this.style.boxShadow='0 8px 25px ${shadowColor}, 0 4px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)';">
            <i class="fas ${iconType}" style="color: white; font-size: 16px; pointer-events: none;"></i>
            ${isFeatured ? '<div class="premium-ring" style="position: absolute; top: -4px; left: -4px; right: -4px; bottom: -4px; border-radius: 50%; border: 2px solid #fbbf24; animation: pulse 2s infinite;"></div>' : ""}
            ${waveAnimation}
          </div>
        `,
        className: "custom-property-marker clickable-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
    };

    // Check if property has a wave assigned (not 'no-wave' and not null/undefined)
    const hasWave = property.waveId && property.waveId !== "no-wave";
    const customIcon = getPropertyIcon(
      property.type,
      property.listingType,
      property.isFeatured,
      hasWave,
    );
    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(
      mapInstanceRef.current,
    );

    // Add popup with image slider
    const images =
      property.images && property.images.length > 0
        ? property.images
        : [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
          ];
    const hasMultipleImages = images.length > 1;
    const popupId = `popup-${property.id}`;

    const isDark = document.documentElement.classList.contains("dark");
    const popupBg = isDark ? "#1f2937" : "#ffffff";
    const textColor = isDark ? "#ffffff" : "#000000";
    const subTextColor = isDark ? "#d1d5db" : "#666666";

    // Get current favorite status for this property
    const isFavorite = getFavoriteStatus(property.id);
    const heartIconClass = isFavorite ? "fas fa-heart" : "far fa-heart";
    const heartIconColor = isFavorite ? "#ef4444" : "#6b7280";
    const heartBgColor = isFavorite ? "#fee2e2" : "#f3f4f6";
    const heartBgHover = isFavorite ? "#fecaca" : "#e5e7eb";

    const popupContent = `
      <div class="property-popup responsive-popup" id="${popupId}" style="
        background: ${popupBg}; 
        color: ${textColor};
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 10px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
        transform: translateZ(10px) rotateX(2deg);
        transform-style: preserve-3d;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);">
        ${
          images.length > 0
            ? `
          <div class="popup-image-container" style="position: relative;">
            <div class="popup-image-slider" style="position: relative; height: 150px; overflow: hidden;">
              ${images
                .map(
                  (img: string, index: number) => `
                <img src="${img}" alt="${getPropertyTitle(property)} - Image ${index + 1}" 
                     class="popup-slide" 
                     style="
                       width: 100%; 
                       height: 150px; 
                       object-fit: cover; 
                       position: absolute; 
                       top: 0; 
                       left: 0;
                       opacity: ${index === 0 ? "1" : "0"};
                       transition: opacity 0.3s ease;
                     "
                     data-slide-index="${index}"
                     onerror="this.style.display='none';" />
              `,
                )
                .join("")}
            </div>
            ${
              hasMultipleImages
                ? `
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
                        direction: ltr;
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
                        direction: ltr;
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
            `
                : ""
            }
          </div>
        `
            : ""
        }
        <div class="popup-content" style="padding: 16px; background: ${popupBg}; direction: ${language === "ar" || language === "kur" ? "rtl" : "ltr"}; text-align: ${language === "ar" || language === "kur" ? "right" : "left"};">
          <h4 class="popup-title" style="color: ${textColor}; font-weight: 600; font-size: 16px; margin-bottom: 8px;">${getPropertyTitle(property)}</h4>
          <p class="popup-address" style="color: ${subTextColor}; font-size: 12px; margin-bottom: 8px;">${property.address}</p>
          <p class="popup-price" style="color: #FF7800; font-weight: 700; font-size: 18px; margin-bottom: 12px;">
            ${property.currency === "USD" ? "$" : property.currency}${parseFloat(property.price).toLocaleString()}${property.listingType === "rent" ? t('property.perMonth') : ""}
          </p>
          <div class="popup-details" style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; font-size: 12px; color: ${subTextColor}; justify-content: ${language === "ar" || language === "kur" ? "flex-end" : "flex-start"};">
            ${property.bedrooms ? `<span style="color: ${subTextColor};">${language === "ar" || language === "kur" ? `${property.bedrooms} ${t("property.beds")} <i class="fas fa-bed" style="color: #FF7800; margin-left: 4px;"></i>` : `<i class="fas fa-bed" style="color: #FF7800; margin-right: 4px;"></i>${property.bedrooms} ${t("property.beds")}`}</span>` : ""} 
            ${property.bathrooms ? `<span style="color: ${subTextColor};">${language === "ar" || language === "kur" ? `${property.bathrooms} ${t("property.baths")} <i class="fas fa-bath" style="color: #FF7800; margin-left: 4px;"></i>` : `<i class="fas fa-bath" style="color: #FF7800; margin-right: 4px;"></i>${property.bathrooms} ${t("property.baths")}`}</span>` : ""}
            ${property.area ? `<span style="color: ${subTextColor};">${language === "ar" || language === "kur" ? `${property.area} ${t("property.sqft")} <i class="fas fa-ruler-combined" style="color: #FF7800; margin-left: 4px;"></i>` : `<i class="fas fa-ruler-combined" style="color: #FF7800; margin-right: 4px;"></i>${property.area} ${t("property.sqft")}`}</span>` : ""}
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
              contactName = property.agent
                ? `${property.agent.firstName || ""} ${property.agent.lastName || ""}`.trim() ||
                  "Agent"
                : "Owner";
            } else if (property.agent && property.agent.phone) {
              contactPhone = property.agent.phone;
              contactName = property.agent
                ? `${property.agent.firstName || ""} ${property.agent.lastName || ""}`.trim() ||
                  "Agent"
                : "Owner";
            }

            if (contactPhone) {
              // Format phone number for display (remove spaces and format cleanly)
              const displayPhone = contactPhone.replace(/\s+/g, "");

              const isCustomer = customerContact && customerContact.phone;
              const bgColor = isCustomer
                ? "rgba(59, 130, 246, 0.1)"
                : "rgba(37, 211, 102, 0.1)";
              const borderColor = isCustomer ? "#3b82f6" : "#25D366";
              const iconColor = isCustomer ? "#3b82f6" : "#25D366";
              const contactType = isCustomer ? "Customer" : "Agent";

              return `
             
              `;
            }
            return "";
          })()}
          <div class="popup-buttons" style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="popup-button" 
                    onclick="window.viewPropertyFromMap('${property.id}')"
                    onmouseover="this.style.background='#e56600'"
                    onmouseout="this.style.background='#FF7800'"
                    style="flex: 1; min-width: 100px; background: #FF7800; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background-color 0.2s ease; z-index: 9999; position: relative;">
              ${t("property.viewProperty")}
            </button>
            ${
              userId
                ? `
              <button id="heart-btn-${property.id}" 
                      class="popup-button heart-button" 
                      onclick="window.toggleFavoriteFromMap('${property.id}')"
                      style="background: ${heartBgColor}; flex: 0 0 40px; width: 40px; height: 40px; min-width: 40px; display: flex; align-items: center; justify-content: center;"
                      onmouseover="this.style.background='${heartBgHover}'"
                      onmouseout="this.style.background='${heartBgColor}'"
                      title="${isFavorite ? "Remove from Favorites" : "Add to Favorites"}">
                <i class="${heartIconClass}" style="color: ${heartIconColor}; font-size: 14px;"></i>
              </button>
            `
                : ""
            }
            ${(() => {
              // Priority: Customer contact (from inquiries) > Property contact phone > Agent phone
              const customerContact = property.customerContact;
              let contactPhone,
                contactName,
                isCustomer = false;

              if (customerContact && customerContact.phone) {
                contactPhone = customerContact.phone;
                contactName = customerContact.name;
                isCustomer = true;
              } else if (property.contactPhone) {
                contactPhone = property.contactPhone;
                contactName = property.agent
                  ? `${property.agent.firstName || ""} ${property.agent.lastName || ""}`.trim() ||
                    "Agent"
                  : "Owner";
              } else if (property.agent && property.agent.phone) {
                contactPhone = property.agent.phone;
                contactName = property.agent
                  ? `${property.agent.firstName || ""} ${property.agent.lastName || ""}`.trim() ||
                    "Agent"
                  : "Owner";
              }

              if (contactPhone) {
                const cleanPhone = contactPhone.replace(/[^+0-9]/g, "");
                // Format phone number for display (remove spaces and format cleanly)
                const displayPhone = contactPhone.replace(/\s+/g, "");
                const callBtnColor = isCustomer ? "#3b82f6" : "#16a34a";
                const callBtnHoverColor = isCustomer ? "#2563eb" : "#0c7b00";
                const whatsappBtnColor = "#25D366";
                const whatsappBtnHoverColor = "#128C7E";
                const contactType = isCustomer ? "Customer" : "Agent";

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
                          onclick="window.open('https://wa.me/${cleanPhone}?text=Hi, I\\'m interested in this property: ${encodeURIComponent(getPropertyTitle(property))} - ${property.currency === "USD" ? "$" : property.currency}${parseFloat(property.price).toLocaleString()}', '_blank')"
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

    // Add marker to map
    marker.addTo(mapInstanceRef.current);

    marker.bindPopup(popupContent, {
      maxWidth: 350,
      minWidth: 240,
      className: "custom-popup",
    });

    // Add click event without zoom behavior
    marker.on("click", () => {
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

  // Update markers when language changes to refresh translations
  useEffect(() => {
    if (currentPropertiesRef.current.length > 0) {
      updateMarkersForProperties(currentPropertiesRef.current);
    }
  }, [language]);

  // Update markers function that accepts properties array - always show all markers
  const updateMarkersForProperties = (
    propertiesToShow: PropertyWithAgent[],
  ) => {
    if (
      !mapInstanceRef.current ||
      typeof window === "undefined" ||
      !(window as any).L
    )
      return;

    // Don't update markers if properties array is empty (might be loading)
    if (!propertiesToShow || propertiesToShow.length === 0) {
      return;
    }

    const L = (window as any).L;

    // Clear existing markers safely
    markersRef.current.forEach((marker) => {
      try {
        if (mapInstanceRef.current && marker) {
          mapInstanceRef.current.removeLayer(marker);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    markersRef.current = [];

    // Get current zoom level to determine clustering strategy
    const currentZoom = mapInstanceRef.current.getZoom();
    const clusters = createZoomBasedClusters(propertiesToShow, currentZoom);
    const isClusteringEnabled = currentZoom < 10;

    clusters.forEach((cluster) => {
      if (cluster.properties.length === 1) {
        // Show individual marker if only one property in cluster
        createSingleMarker(cluster.properties[0], L);
      } else {
        // Show cluster marker if multiple properties are grouped
        createClusterMarker(cluster, L, isClusteringEnabled);
      }
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    // Prevent duplicate calls within 100ms
    const now = Date.now();
    if (clickGuard.current && now - clickGuard.current < 100) return;
    clickGuard.current = now;

    console.log(`Filter change: ${key} = ${value}`);
    isLocalUpdate.current = true;
    const newFilters = { ...localFilters };

    // Handle special "clear" values
    if (
      value === "any-price" ||
      value === "all-types" ||
      value === "any-bedrooms"
    ) {
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
        if (key === "maxPrice" || key === "bedrooms") {
          newFilters[key as keyof PropertyFilters] = parseInt(value) as any;
        } else {
          newFilters[key as keyof PropertyFilters] = value as any;
        }
      }
    }

    // Always maintain the limit for map properties
    newFilters.limit = 100;

    setLocalFilters(newFilters);
    console.log("Updated filters:", newFilters);

    // Immediately trigger parent filter change to call API
    onFilterChange?.(newFilters);
  };

  // Geolocation function
  const handleGetMyLocation = () => {
    if (!mapInstanceRef.current) return;

    setIsLocating(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const L = (window as any).L;

          if (mapInstanceRef.current && L) {
            // Smoothly fly to user's location with animation
            mapInstanceRef.current.flyTo([latitude, longitude], 15, {
              animate: true,
              duration: 2.5, // 2.5 seconds smooth animation
              easeLinearity: 0.25,
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
              className: "user-location-marker",
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            });

            // Remove any existing user location markers
            markersRef.current.forEach((marker) => {
              if (
                marker.options &&
                marker.options.icon &&
                marker.options.icon.options.className === "user-location-marker"
              ) {
                mapInstanceRef.current.removeLayer(marker);
              }
            });

            const userMarker = L.marker([latitude, longitude], {
              icon: userLocationIcon,
            }).addTo(mapInstanceRef.current);
            userMarker.bindPopup("📍 Your Current Location");
            markersRef.current.push(userMarker);
          }

          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          alert(
            "Unable to get your location. Please check your browser permissions.",
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    } else {
      setIsLocating(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        {/* Map Container - Full Size */}
        <div className="relative h-screen" data-testid="property-map">
          <div ref={mapRef} className="w-full h-full" />

          {/* Legend Overlay on Map */}
          <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 z-[1000] transition-all duration-500 ease-out">
            <div className="p-4 md:p-5 transition-all duration-300 space-y-4">
              {/* Get My Location Icon Button - Positioned above filters */}
              <div className="flex justify-end">
                <Button
                  onClick={handleGetMyLocation}
                  disabled={isLocating}
                  className={`w-10 h-10 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 flex-shrink-0 flex items-center justify-center ${isLocating ? "animate-pulse" : ""}`}
                  data-testid="footer-location-button"
                >
                  <Navigation
                    className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`}
                    style={{ color: "#FF7800" }}
                  />
                </Button>
              </div>

              {/* Filter buttons row */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-sm">
                <div
                  className={`flex items-center ${spacingFilter} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                    localFilters.listingType === "sale"
                      ? "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-600"
                      : "bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFilterChange("listingType", "sale");
                  }}
                >
                  <div
                    className={`w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex-shrink-0 shadow-lg ${localFilters.listingType === "sale" ? "animate-pulse" : ""}`}
                  ></div>
                  <span
                    className={`font-semibold text-sm drop-shadow-lg ${localFilters.listingType === "sale" ? "text-red-700 dark:text-red-300" : "text-black dark:text-white"}`}
                  >
                    {t("filter.forSale")}
                  </span>
                </div>
                <div
                  className={`flex items-center ${spacingFilter} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                    localFilters.listingType === "rent"
                      ? "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-600"
                      : "bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFilterChange("listingType", "rent");
                  }}
                >
                  <div
                    className={`w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex-shrink-0 shadow-lg ${localFilters.listingType === "rent" ? "animate-pulse" : ""}`}
                  ></div>
                  <span
                    className={`font-semibold text-sm drop-shadow-lg ${localFilters.listingType === "rent" ? "text-green-700 dark:text-green-300" : "text-black dark:text-white"}`}
                  >
                    {t("filter.forRent")}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 ${
                    isRTL ? "flex-wrap" : "flex-nowrap"
                  }`}
                >
                  <div
                    className={`flex items-center ${spacingType} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                      localFilters.type === "house"
                        ? "bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600"
                        : "bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFilterChange("type", "house");
                    }}
                  >
                    <i
                      className="fas fa-home text-sm sm:text-base flex-shrink-0 drop-shadow-lg"
                      style={{ color: "#FF7800" }}
                    ></i>
                    <span
                      className={`text-sm font-medium drop-shadow-lg ${localFilters.type === "house" ? "text-orange-700 dark:text-orange-300" : "text-black dark:text-white"}`}
                    >
                      {t("filter.houses")}
                    </span>
                  </div>
                  <div
                    className={`flex items-center ${spacingType} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                      localFilters.type === "apartment"
                        ? "bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600"
                        : "bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFilterChange("type", "apartment");
                    }}
                  >
                    <i
                      className="fas fa-building text-sm sm:text-base flex-shrink-0 drop-shadow-lg"
                      style={{ color: "#FF7800" }}
                    ></i>
                    <span
                      className={`text-sm font-medium drop-shadow-lg ${localFilters.type === "apartment" ? "text-orange-700 dark:text-orange-300" : "text-black dark:text-white"}`}
                    >
                      {t("filter.apartments")}
                    </span>
                  </div>
                  <div
                    className={`flex items-center ${spacingType} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                      localFilters.type === "villa"
                        ? "bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600"
                        : "bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFilterChange("type", "villa");
                    }}
                  >
                    <i
                      className="fas fa-university text-sm sm:text-base flex-shrink-0 drop-shadow-lg"
                      style={{ color: "#FF7800" }}
                    ></i>
                    <span
                      className={`text-sm font-medium drop-shadow-lg ${localFilters.type === "villa" ? "text-orange-700 dark:text-orange-300" : "text-black dark:text-white"}`}
                    >
                      {t("filter.villa")}
                    </span>
                  </div>
                  <div
                    className={`flex items-center ${spacingType} p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer ${
                      localFilters.type === "land"
                        ? "bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-600"
                        : "bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFilterChange("type", "land");
                    }}
                  >
                    <i
                      className="fas fa-map-marked-alt text-sm sm:text-base flex-shrink-0 drop-shadow-lg"
                      style={{ color: "#FF7800" }}
                    ></i>
                    <span
                      className={`text-sm font-medium drop-shadow-lg ${localFilters.type === "land" ? "text-orange-700 dark:text-orange-300" : "text-black dark:text-white"}`}
                    >
                      {t("filter.land")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Fallback content if map fails to load */}
          {typeof window === "undefined" || !(window as any).L ? (
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center p-8 rounded-2xl bg-white/20 backdrop-blur-md shadow-2xl border border-white/30">
                <div className="relative">
                  <MapPin
                    className="mx-auto h-16 w-16 mb-6 animate-bounce drop-shadow-lg"
                    style={{ color: "#FF7800" }}
                  />
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: "#FF7800" }}
                  ></div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {t("map.loadingTitle")}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t("map.loadingDescription")}
                </p>
                <div className="flex items-center justify-center space-x-1 mb-4">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: "#FF7800" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{
                      animationDelay: "0.2s",
                      backgroundColor: "#FF7800",
                    }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{
                      animationDelay: "0.4s",
                      backgroundColor: "#FF7800",
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {t("map.poweredBy")}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
