import { useState, useEffect } from "react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import PropertyCard from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFavorites } from "@/hooks/use-properties";
import { ArrowLeft, Heart, Home as HomeIcon } from "lucide-react";
import type { Property } from "@/types";

export default function FavoritesPage() {
  const [userId] = useState("demo-user-id"); // In real app, get from auth context
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showMap, setShowMap] = useState(false);
  const { data: favorites, isLoading, error } = useFavorites(userId);

  const handleMapClick = (property: Property) => {
    setSelectedProperty(property);
    setShowMap(true);
  };

  useEffect(() => {
    document.title = "My Favorites - EstateAI";
  }, []);

  useEffect(() => {
    if (showMap && selectedProperty) {
      // Initialize map
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        // Create map
        const L = (window as any).L;
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
          // Clear any existing map
          mapContainer.innerHTML = '';
          
          // Get coordinates - use default coordinates for demo
          const lat = selectedProperty.latitude || 36.2048; // Default to Erbil
          const lng = selectedProperty.longitude || 44.0088;
          
          const map = L.map('map-container').setView([lat, lng], 15);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          
          // Add property marker
          const marker = L.marker([lat, lng]).addTo(map);
          marker.bindPopup(`
            <div class="p-2">
              <h4 class="font-semibold">${selectedProperty.title}</h4>
              <p class="text-sm text-gray-600">${selectedProperty.address}</p>
              <p class="text-sm font-medium text-orange-600">
                ${selectedProperty.currency === 'USD' ? '$' : selectedProperty.currency}${parseFloat(selectedProperty.price).toLocaleString()}${selectedProperty.listingType === 'rent' ? '/mo' : ''}
              </p>
            </div>
          `).openPopup();
        }
      };
      
      // Load CSS if not already loaded
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      
      document.head.appendChild(script);
      
      return () => {
        // Cleanup
        const scripts = document.querySelectorAll('script[src*="leaflet"]');
        scripts.forEach(s => s.remove());
      };
    }
  }, [showMap, selectedProperty]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your favorites...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">Error loading favorites. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2" data-testid="back-to-home">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div>
            </div>
          </div>
        </div>

        {/* Favorites List */}
        {!favorites || favorites.length === 0 ? (
          <Card className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/10">
            <CardContent className="py-16">
              <div className="text-center">
                <Heart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No favorites yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start adding properties to your favorites by clicking the heart icon on property listings.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {favorites.map((property) => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  userId={userId} 
                  showMapButton={true}
                  onMapClick={handleMapClick}
                />
              ))}
            </div>

            {/* Map Modal */}
            {showMap && selectedProperty && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMap(false)}>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{selectedProperty.title}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowMap(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="h-96">
                    <div 
                      id="map-container" 
                      className="w-full h-full rounded-lg"
                      style={{ height: '100%' }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    📍 {selectedProperty.address}, {selectedProperty.city}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}