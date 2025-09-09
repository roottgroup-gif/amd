import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/navigation";
import PropertyCard from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFavorites } from "@/hooks/use-properties";
import { ArrowLeft, Heart, Home as HomeIcon } from "lucide-react";
import type { Property } from "@/types";

export default function FavoritesPage() {
  const [userId] = useState("demo-user-id"); // In real app, get from auth context
  const { data: favorites, isLoading, error } = useFavorites(userId);
  const [, setLocation] = useLocation();

  const handleMapClick = (property: Property) => {
    // Navigate to home page with property ID to show on map
    setLocation(`/?showProperty=${property.id}`);
  };

  useEffect(() => {
    document.title = "My Favorites - EstateAI";
  }, []);

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
          </>
        )}
      </div>
    </div>
  );
}