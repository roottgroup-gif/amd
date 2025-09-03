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
import { Tag, Key, Home, Building2, MapPin, Crown, Lightbulb } from "lucide-react";

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

  // Mock AI recommendations data
  const aiRecommendations = [
    {
      id: "ai-1",
      title: "Luxury Penthouse",
      address: "Erbil City Center, Kurdistan",
      price: "750000",
      currency: "USD",
      listingType: "sale" as const,
      bedrooms: 3,
      bathrooms: 2,
      images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"],
      matchPercentage: 95,
      reasons: [
        "Matches your budget preference",
        "Located in your preferred area", 
        "Modern amenities you searched for"
      ]
    },
    {
      id: "ai-2", 
      title: "Designer Home",
      address: "Sulaymaniyah Heights, Kurdistan",
      price: "380000",
      currency: "USD",
      listingType: "sale" as const,
      bedrooms: 4,
      bathrooms: 3,
      images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"],
      matchPercentage: 88,
      reasons: [
        "Similar to your saved properties",
        "Great investment potential",
        "Near schools and amenities"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-center text-white max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="hero-title">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100" data-testid="hero-subtitle">
              {t('hero.subtitle')}
            </p>
            
            <SearchBar 
              onResults={handleSearchResults}
              className="max-w-2xl mx-auto"
            />
          </div>
        </div>
      </section>

      {/* Quick Filters */}
      <section className="py-8 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => handleFilterClick('sale')}
              className={activeFilter === 'sale' ? '' : 'variant-outline'}
              data-testid="filter-sale"
            >
              <Tag className="mr-2 h-4 w-4" />
              {t('filter.forSale')}
            </Button>
            <Button
              onClick={() => handleFilterClick('rent')}
              variant={activeFilter === 'rent' ? 'default' : 'outline'}
              data-testid="filter-rent"
            >
              <Key className="mr-2 h-4 w-4" />
              {t('filter.forRent')}
            </Button>
            <Button variant="outline" data-testid="filter-houses">
              <Home className="mr-2 h-4 w-4" />
              {t('filter.houses')}
            </Button>
            <Button variant="outline" data-testid="filter-apartments">
              <Building2 className="mr-2 h-4 w-4" />
              {t('filter.apartments')}
            </Button>
            <Button variant="outline" data-testid="filter-near-me">
              <MapPin className="mr-2 h-4 w-4" />
              {t('filter.nearMe')}
            </Button>
          </div>
        </div>
      </section>

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

      {/* Featured Properties */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Properties
            </h2>
            <p className="text-xl text-muted-foreground">
              Discover our handpicked selection of premium properties
            </p>
          </div>
          
          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties?.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/properties">
              <Button size="lg" data-testid="view-all-properties">
                View All Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

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

      {/* AI Recommendations */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 mb-4">
              <Crown className="h-4 w-4" />
              <span className="text-sm font-medium">AI Powered</span>
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Personalized Recommendations
            </h2>
            <p className="text-xl text-muted-foreground">
              Properties curated just for you based on your preferences
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {aiRecommendations.map((recommendation, index) => (
              <Card key={recommendation.id} className="overflow-hidden" data-testid={`ai-recommendation-${index}`}>
                <div className="relative">
                  <img 
                    src={recommendation.images[0]}
                    alt={recommendation.title}
                    className="w-full h-64 object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-yellow-500 text-white">
                    <Crown className="mr-1 h-3 w-3" />
                    AI Match: {recommendation.matchPercentage}%
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{recommendation.title}</h3>
                  <p className="text-muted-foreground mb-4">{recommendation.address}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-primary">
                      ${parseInt(recommendation.price).toLocaleString()}
                    </span>
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <span>{recommendation.bedrooms} Beds</span>
                      <span>{recommendation.bathrooms} Baths</span>
                    </div>
                  </div>
                  <Card className="bg-primary/10 p-4 mb-4">
                    <p className="text-sm text-primary font-medium mb-2">
                      <Lightbulb className="inline mr-2 h-4 w-4" />
                      Why AI recommends this:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {recommendation.reasons.map((reason, idx) => (
                        <li key={idx}>• {reason}</li>
                      ))}
                    </ul>
                  </Card>
                  <Button className="w-full">View Property</Button>
                </CardContent>
              </Card>
            ))}
          </div>
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
