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
import type { Property, AISearchResponse } from "@/types";
import { Tag, Key, Home, Building2, MapPin } from "lucide-react";

export default function HomePage() {
  const { t } = useTranslation();
  const { data: featuredProperties, isLoading: featuredLoading } = useFeaturedProperties();
  const [searchResults, setSearchResults] = useState<AISearchResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('sale');

  // Load all properties for the map (not filtered by activeFilter)
  const { data: mapProperties } = useProperties({
    limit: 100 // Get more properties for the map
  });

  const handleSearchResults = (results: AISearchResponse) => {
    setSearchResults(results);
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
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
          onPropertyClick={(property) => {
            window.location.href = `/property/${property.id}`;
          }}
          className="h-full w-full"
        />
      </section>
    </div>
  );
}
