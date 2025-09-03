import { useState } from "react";
import { Link } from "wouter";
import SearchBar from "@/components/search-bar";
import PropertyCard from "@/components/property-card";
import PropertyMap from "@/components/property-map";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { useFeaturedProperties, useProperties } from "@/hooks/use-properties";
import type { Property, AISearchResponse, PropertyFilters } from "@/types";
import { Tag, Key, Home, Building2, MapPin } from "lucide-react";

export default function HomePage() {
  const { t } = useTranslation();
  const { data: featuredProperties, isLoading: featuredLoading } = useFeaturedProperties();
  const [searchResults, setSearchResults] = useState<AISearchResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('sale');
  const [mapFilters, setMapFilters] = useState<PropertyFilters>({
    limit: 100 // Get more properties for the map
  });

  // Load properties for the map with current filters
  const { data: mapProperties } = useProperties(mapFilters);

  const handleSearchResults = (results: AISearchResponse) => {
    setSearchResults(results);
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleMapFilterChange = (filters: PropertyFilters) => {
    setMapFilters({
      ...filters,
      limit: 100 // Always maintain the limit for map
    });
  };

  

  return (
    <div className="h-screen w-full bg-background">
      {/* Search Results */}
      {searchResults && (
        <section className="absolute top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h2 className="text-xl font-bold mb-4">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto">
              {searchResults.results.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Full Screen Map Section */}
      <section className="h-full w-full">
        <PropertyMap 
          properties={mapProperties || []}
          filters={mapFilters}
          onFilterChange={handleMapFilterChange}
          onPropertyClick={(property) => {
            window.location.href = `/property/${property.id}`;
          }}
          className="h-full w-full"
        />
      </section>
    </div>
  );
}
