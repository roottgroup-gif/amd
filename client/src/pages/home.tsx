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
    <div className="min-h-screen bg-background">
      {/* Search Results */}
      {searchResults && (
        <section className="py-8 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {searchResults.results.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Interactive Map Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Explore Properties on Map
            </h2>
            <p className="text-xl text-muted-foreground">
              Find properties in your preferred locations
            </p>
          </div>
          
          <PropertyMap 
            properties={mapProperties || []}
            onPropertyClick={(property) => {
              window.location.href = `/property/${property.id}`;
            }}
          />
        </div>
      </section>

      

      
    </div>
  );
}
