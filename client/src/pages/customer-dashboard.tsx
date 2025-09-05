import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import PropertyMap from '@/components/property-map';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { PropertyWithAgent, PropertyFilters } from '@shared/schema';
import { 
  Heart, Search, Filter, LogOut, MapPin, DollarSign,
  Home, Eye, Bed, Bath, Maximize, Phone, Mail, Calendar,
  Star, Bookmark, MessageSquare, User, Settings
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [mapFilters, setMapFilters] = useState<PropertyFilters>({ limit: 100 });
  const [activeTab, setActiveTab] = useState('browse');

  // Fetch all properties
  const { data: allProperties = [], isLoading: propertiesLoading } = useQuery<PropertyWithAgent[]>({
    queryKey: ['/api/properties', mapFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(mapFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/properties?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });

  // Fetch user's favorites
  const { data: favorites = [] } = useQuery<PropertyWithAgent[]>({
    queryKey: ['/api/users', user?.id, 'favorites'],
    enabled: !!user?.id,
  });

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await apiRequest('POST', '/api/favorites', {
        userId: user?.id,
        propertyId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'favorites'] });
      toast({
        title: 'Success',
        description: 'Property added to favorites',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add to favorites',
        variant: 'destructive',
      });
    },
  });

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await apiRequest('DELETE', '/api/favorites', {
        userId: user?.id,
        propertyId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'favorites'] });
      toast({
        title: 'Success',
        description: 'Property removed from favorites',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove from favorites',
        variant: 'destructive',
      });
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Logout failed',
        variant: 'destructive',
      });
    }
  };

  const handleAddToFavorites = (propertyId: string) => {
    addToFavoritesMutation.mutate(propertyId);
  };

  const handleRemoveFromFavorites = (propertyId: string) => {
    removeFromFavoritesMutation.mutate(propertyId);
  };

  const isPropertyFavorite = (propertyId: string) => {
    return favorites.some(fav => fav.id === propertyId);
  };

  const handleMapFilterChange = (filters: PropertyFilters) => {
    setMapFilters(filters);
  };

  const handlePropertyInquiry = (property: PropertyWithAgent) => {
    // Open inquiry modal or navigate to property detail
    navigate(`/property/${property.id}`);
  };

  // Filter properties based on search
  const filteredProperties = allProperties.filter(property => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      property.title.toLowerCase().includes(searchLower) ||
      property.description?.toLowerCase().includes(searchLower) ||
      property.address.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower) ||
      property.type.toLowerCase().includes(searchLower)
    );
  });

  return (
    <ProtectedRoute requiredRole={['user', 'admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Home className="h-8 w-8 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Property Portal
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={user?.avatar || ''} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0] || user?.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="browse">Browse Properties</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="favorites">
                Favorites ({favorites.length})
              </TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-6">
              {/* Search and Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>Find Your Perfect Property</CardTitle>
                  <CardDescription>
                    Search through our extensive property listings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search properties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                        data-testid="input-search"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Select 
                        value={mapFilters.type || 'all'} 
                        onValueChange={(value) => 
                          setMapFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value }))
                        }
                      >
                        <SelectTrigger className="w-48" data-testid="select-type-filter">
                          <SelectValue placeholder="Property Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={mapFilters.listingType || 'all'} 
                        onValueChange={(value) => 
                          setMapFilters(prev => ({ ...prev, listingType: value === 'all' ? undefined : value as 'sale' | 'rent' }))
                        }
                      >
                        <SelectTrigger className="w-48" data-testid="select-listing-filter">
                          <SelectValue placeholder="Listing Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Listings</SelectItem>
                          <SelectItem value="sale">For Sale</SelectItem>
                          <SelectItem value="rent">For Rent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Properties Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {propertiesLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredProperties.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-gray-500">
                    <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No properties found matching your criteria.</p>
                  </div>
                ) : (
                  filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      isFavorite={isPropertyFavorite(property.id)}
                      onToggleFavorite={(isFav) => 
                        isFav ? handleRemoveFromFavorites(property.id) : handleAddToFavorites(property.id)
                      }
                      onInquiry={handlePropertyInquiry}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="map" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Map</CardTitle>
                  <CardDescription>
                    Explore properties on the interactive map
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[600px] w-full">
                    <PropertyMap 
                      properties={allProperties}
                      filters={mapFilters}
                      onFilterChange={handleMapFilterChange}
                      onPropertyClick={handlePropertyInquiry}
                      className="h-full w-full rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Favorite Properties</CardTitle>
                  <CardDescription>
                    Properties you've saved for later
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {favorites.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>You haven't saved any properties yet.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab('browse')}
                      >
                        Browse Properties
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favorites.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          isFavorite={true}
                          onToggleFavorite={() => handleRemoveFromFavorites(property.id)}
                          onInquiry={handlePropertyInquiry}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Manage your account information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.avatar || ''} />
                        <AvatarFallback className="text-lg">
                          {user?.firstName?.[0]}{user?.lastName?.[0] || user?.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        <Badge variant="secondary" className="mt-1">Customer</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Username</label>
                        <Input value={user?.username || ''} disabled />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input value={user?.email || ''} disabled />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">First Name</label>
                        <Input value={user?.firstName || ''} disabled />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name</label>
                        <Input value={user?.lastName || ''} disabled />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone</label>
                        <Input value={user?.phone || ''} disabled />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Member Since</label>
                        <Input value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} disabled />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Property Card Component for Customers
function PropertyCard({ 
  property, 
  isFavorite,
  onToggleFavorite,
  onInquiry
}: { 
  property: PropertyWithAgent;
  isFavorite: boolean;
  onToggleFavorite: (isFavorite: boolean) => void;
  onInquiry: (property: PropertyWithAgent) => void;
}) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg relative overflow-hidden">
          {property.images && property.images.length > 0 ? (
            <img 
              src={property.images[0]} 
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex space-x-1">
            <Button
              size="sm"
              variant={isFavorite ? "default" : "secondary"}
              onClick={() => onToggleFavorite(isFavorite)}
              className={`transition-all ${isFavorite ? 'text-white' : ''}`}
              data-testid={`button-favorite-${property.id}`}
            >
              <Heart className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
          <div className="absolute top-2 left-2">
            <Badge variant={property.listingType === 'sale' ? 'default' : 'secondary'}>
              {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
            </Badge>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
            <Badge variant="outline" className="text-xs">
              {property.type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {property.description}
          </p>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <span className="flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {property.city}, {property.country}
            </span>
            <span className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {property.views || 0} views
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            {property.bedrooms && (
              <span className="flex items-center">
                <Bed className="h-3 w-3 mr-1" />
                {property.bedrooms}
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center">
                <Bath className="h-3 w-3 mr-1" />
                {property.bathrooms}
              </span>
            )}
            {property.area && (
              <span className="flex items-center">
                <Maximize className="h-3 w-3 mr-1" />
                {property.area} ft²
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-lg font-bold text-green-600">
                ${parseFloat(property.price).toLocaleString()}
              </p>
              {property.agent && (
                <p className="text-xs text-muted-foreground">
                  Agent: {property.agent.firstName} {property.agent.lastName}
                </p>
              )}
            </div>
            <Button 
              size="sm"
              onClick={() => onInquiry(property)}
              data-testid={`button-inquire-${property.id}`}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Inquire
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}