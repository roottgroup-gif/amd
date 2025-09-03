import { useState, useEffect, useCallback, useMemo } from "react";
import Navigation from "@/components/navigation";
import PropertyCard from "@/components/property-card";
import SearchBar from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "@/lib/i18n";
import { useProperties } from "@/hooks/use-properties";
import type { PropertyFilters, AISearchResponse } from "@/types";
import { Search, Filter, Grid, List, MapPin } from "lucide-react";

export default function PropertiesPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<PropertyFilters>({
    sortBy: 'date',
    sortOrder: 'desc',
    limit: 20,
    offset: 0
  });
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [cityInput, setCityInput] = useState('');
  const [searchResults, setSearchResults] = useState<AISearchResponse | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: properties, isLoading } = useProperties(filters);

  // Debounced city filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        city: cityInput.trim() || undefined,
        offset: 0
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [cityInput]);

  const handleFilterChange = useCallback((key: keyof PropertyFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: (value === 'all' || value === 'any' || value === '') ? undefined : value,
      offset: 0 // Reset pagination when filters change
    }));
  }, []);

  // Auto-apply price range with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
        offset: 0
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [priceRange]);

  const handleSearchResults = (results: AISearchResponse) => {
    setSearchResults(results);
    setFilters(prev => ({ ...prev, ...results.filters }));
  };

  const clearFilters = useCallback(() => {
    setFilters({
      sortBy: 'date',
      sortOrder: 'desc',
      limit: 20,
      offset: 0
    });
    setPriceRange([0, 1000000]);
    setCityInput('');
    setSearchResults(null);
  }, []);

  const displayProperties = searchResults ? searchResults.results : properties || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-4" data-testid="properties-title">
            Properties for Sale & Rent
          </h1>
          <SearchBar onResults={handleSearchResults} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="clear-filters">
                    Clear
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Listing Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Listing Type</label>
                    <Select 
                      value={filters.listingType || ''} 
                      onValueChange={(value) => handleFilterChange('listingType', value || undefined)}
                    >
                      <SelectTrigger data-testid="listing-type-select">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sale">For Sale</SelectItem>
                        <SelectItem value="rent">For Rent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Property Type</label>
                    <Select 
                      value={filters.type || ''} 
                      onValueChange={(value) => handleFilterChange('type', value || undefined)}
                    >
                      <SelectTrigger data-testid="property-type-select">
                        <SelectValue placeholder="All Properties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Price Range: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={1000000}
                      step={10000}
                      className="mt-2"
                      data-testid="price-range-slider"
                    />
                  </div>

                  {/* Bedrooms */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Bedrooms</label>
                    <Select 
                      value={filters.bedrooms?.toString() || ''} 
                      onValueChange={(value) => handleFilterChange('bedrooms', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger data-testid="bedrooms-select">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bathrooms */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Bathrooms</label>
                    <Select 
                      value={filters.bathrooms?.toString() || ''} 
                      onValueChange={(value) => handleFilterChange('bathrooms', value ? parseInt(value) : undefined)}
                    >
                      <SelectTrigger data-testid="bathrooms-select">
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

                  {/* Location */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">City</label>
                    <Input
                      placeholder="Enter city..."
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      data-testid="city-input"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold" data-testid="results-count">
                  {isLoading ? 'Loading...' : `${displayProperties.length} Properties Found`}
                </h2>
                {searchResults && (
                  <span className="text-sm text-muted-foreground">
                    Search: "{searchResults.query}"
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* Sort By */}
                <Select 
                  value={`${filters.sortBy}-${filters.sortOrder}`} 
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
                >
                  <SelectTrigger className="w-48" data-testid="sort-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Newest First</SelectItem>
                    <SelectItem value="date-asc">Oldest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="views-desc">Most Popular</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    data-testid="grid-view-button"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    data-testid="list-view-button"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Properties Grid/List */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            ) : displayProperties.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {displayProperties.map((property) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property} 
                    className={viewMode === 'list' ? 'flex flex-row' : ''}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or filters to find more properties.
                </p>
                <Button onClick={clearFilters} data-testid="clear-filters-no-results">
                  Clear All Filters
                </Button>
              </Card>
            )}

            {/* Load More Button */}
            {displayProperties.length > 0 && displayProperties.length >= (filters.limit || 20) && (
              <div className="text-center mt-8">
                <Button 
                  onClick={() => handleFilterChange('limit', (filters.limit || 20) + 20)}
                  data-testid="load-more-button"
                >
                  Load More Properties
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
