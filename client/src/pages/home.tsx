import { useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
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
      <Navigation />
      
      

      

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

      

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Home className="text-primary-foreground h-5 w-5" />
                </div>
                <span className="text-xl font-bold">EstateAI</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Your AI-powered real estate companion. Find your perfect home with intelligent recommendations.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/properties" className="hover:text-background">Properties</Link></li>
                <li><Link href="/agent-dashboard" className="hover:text-background">Agents</Link></li>
                <li><a href="#" className="hover:text-background">About Us</a></li>
                <li><a href="#" className="hover:text-background">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-background">Buy Property</a></li>
                <li><a href="#" className="hover:text-background">Rent Property</a></li>
                <li><a href="#" className="hover:text-background">Property Management</a></li>
                <li><a href="#" className="hover:text-background">AI Recommendations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>📞 +964 750 123 4567</p>
                <p>📧 info@estateai.com</p>
                <p>📍 Erbil, Kurdistan Region</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-muted-foreground/20 mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 EstateAI. All rights reserved. Built with React, TailwindCSS & AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
