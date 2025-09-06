import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import PropertyMap from '@/components/property-map';
import LocationSelectionMap from '@/components/location-selection-map';
import ImageUpload from '@/components/image-upload';
import ProfilePhotoUpload from '@/components/profile-photo-upload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import type { PropertyWithAgent, PropertyFilters } from '@shared/schema';
import { 
  Heart, Search, Filter, LogOut, MapPin, DollarSign,
  Home, Eye, Bed, Bath, Maximize, Phone, Mail, Calendar,
  Star, Bookmark, MessageSquare, User, Settings, Plus,
  Building, University, Mountain, Tag, Key, Edit, Trash2
} from 'lucide-react';

// Property form schema for validation
const propertyFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['house', 'apartment', 'villa', 'land']),
  listingType: z.enum(['sale', 'rent']),
  price: z.string().min(1, 'Price is required'),
  currency: z.string().default('USD'),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  area: z.number().min(1, 'Area is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().default('Iraq'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  contactPhone: z.string().optional(),
});

// Profile form schema for validation
const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof propertyFormSchema>;
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [mapFilters, setMapFilters] = useState<PropertyFilters>({ limit: 100 });
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyWithAgent | null>(null);

  // Property form
  const propertyForm = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'house',
      listingType: 'sale',
      price: '',
      currency: 'USD',
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      address: '',
      city: '',
      country: 'Iraq',
      latitude: undefined,
      longitude: undefined,
      images: [],
      amenities: [],
      features: [],
      contactPhone: user?.phone || '',
    },
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    },
  });

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [user, profileForm]);

  // Update property form contact phone when user data changes
  useEffect(() => {
    if (user?.phone && propertyForm.getValues('contactPhone') !== user.phone) {
      propertyForm.setValue('contactPhone', user.phone);
    }
  }, [user, propertyForm]);

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

  // Fetch user's own properties
  const { data: userProperties = [], isLoading: userPropertiesLoading } = useQuery<PropertyWithAgent[]>({
    queryKey: ['/api/users', user?.id, 'properties'],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/properties`);
      if (!response.ok) throw new Error('Failed to fetch user properties');
      return response.json();
    },
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

  // Create property mutation for customers
  const createPropertyMutation = useMutation({
    mutationFn: async (propertyData: PropertyFormValues) => {
      const response = await apiRequest('POST', '/api/properties', {
        ...propertyData,
        agentId: user?.id, // Customer becomes the owner/contact person
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'properties'] });
      propertyForm.reset();
      toast({
        title: 'Success',
        description: 'Property added successfully! It will appear on the map.',
      });
      setActiveTab('map'); // Switch to map view to see the new property
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add property',
        variant: 'destructive',
      });
    },
  });

  // Edit property mutation
  const editPropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PropertyFormValues }) => {
      const response = await apiRequest('PUT', `/api/properties/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'properties'] });
      setEditingProperty(null);
      propertyForm.reset();
      setSelectedLocation(null);
      toast({
        title: 'Success',
        description: 'Property updated successfully',
      });
      setActiveTab('my-properties');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update property',
        variant: 'destructive',
      });
    },
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await apiRequest('DELETE', `/api/properties/${propertyId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'properties'] });
      toast({
        title: 'Success',
        description: 'Property deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete property',
        variant: 'destructive',
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileFormValues) => {
      const response = await apiRequest('PUT', '/api/profile', profileData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsEditingProfile(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
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

  const onSubmitProperty = (data: PropertyFormValues) => {
    // Convert data to match backend expectations (InsertProperty type)
    const submitData: any = {
      ...data,
      price: data.price.toString(), // Convert to string as expected by backend
      latitude: data.latitude ? data.latitude.toString() : undefined, // Convert to string if provided
      longitude: data.longitude ? data.longitude.toString() : undefined, // Convert to string if provided
    };
    
    if (editingProperty) {
      editPropertyMutation.mutate({ id: editingProperty.id, data: submitData });
    } else {
      createPropertyMutation.mutate(submitData);
    }
  };

  const onSubmitProfile = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const handleEditProperty = (property: PropertyWithAgent) => {
    setEditingProperty(property);
    propertyForm.reset({
      title: property.title,
      description: property.description || '',
      type: property.type as 'house' | 'apartment' | 'villa' | 'land',
      listingType: property.listingType as 'sale' | 'rent',
      price: property.price.toString(),
      currency: property.currency || 'USD',
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      area: property.area || 0,
      address: property.address,
      city: property.city,
      country: property.country,
      contactPhone: (property as any).contactPhone || user?.phone || '',
      amenities: property.amenities || [],
      features: property.features || [],
      images: property.images || [],
    });
    if (property.latitude && property.longitude) {
      setSelectedLocation({
        lat: parseFloat(property.latitude),
        lng: parseFloat(property.longitude),
      });
    }
    setActiveTab('add-property');
  };

  const handleDeleteProperty = async (propertyId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deletePropertyMutation.mutate(propertyId);
    }
  };

  const handleCancelPropertyEdit = () => {
    setEditingProperty(null);
    propertyForm.reset();
    setSelectedLocation(null);
    setActiveTab('my-properties'); // Navigate back to properties list
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Reset form to current user data
    profileForm.reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    });
  };

  const handleLocationSelect = (locationData: { lat: number; lng: number; address?: string; city?: string; country?: string }) => {
    const { lat, lng, address, city, country } = locationData;
    
    setSelectedLocation({ lat, lng });
    propertyForm.setValue('latitude', lat);
    propertyForm.setValue('longitude', lng);
    
    // Auto-fill address fields from reverse geocoding
    if (address && address.trim()) {
      propertyForm.setValue('address', address.trim());
      toast({
        title: 'Address Auto-filled',
        description: `Address set to: ${address}`,
      });
    }
    
    if (city && city.trim()) {
      propertyForm.setValue('city', city.trim());
    }
    
    if (country && country.trim()) {
      propertyForm.setValue('country', country.trim());
    }
    
    // Show success message if we got location data
    if (address || city || country) {
      toast({
        title: 'Location Details Found',
        description: 'Address fields have been automatically filled from the selected location.',
      });
    } else {
      // Fallback for areas where geocoding might not work well
      if (lat > 35.0 && lat < 37.5 && lng > 43.0 && lng < 46.0) {
        if (!propertyForm.getValues('city')) {
          propertyForm.setValue('city', 'Erbil');
        }
        if (!propertyForm.getValues('country')) {
          propertyForm.setValue('country', 'Iraq');
        }
      }
    }
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
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-800 dark:to-orange-900 shadow-lg border-b border-orange-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
              <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Home className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">
                      Property Portal
                    </h1>
                    <p className="text-xs sm:text-sm text-orange-100 hidden sm:block">Find Your Dream Home</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-4">
                <div className="flex items-center space-x-2 sm:space-x-3 bg-white/10 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                    <AvatarImage src={user?.avatar || ''} alt="Profile photo" />
                    <AvatarFallback className="bg-white text-orange-600 font-medium">
                      {user?.firstName?.[0]}{user?.lastName?.[0] || user?.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white">
                      {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}
                    </p>
                    <p className="text-xs text-orange-100">Customer</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-orange-600 transition-all duration-200"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto bg-transparent gap-1 p-2">
                <TabsTrigger 
                  value="browse" 
                  className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200"
                >
                  <Search className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Browse</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="map" 
                  className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200"
                >
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Map</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="add-property" 
                  className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Add</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="my-properties" 
                  className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200 col-span-1 sm:col-span-1"
                >
                  <Building className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">My Properties</span>
                  <span className="sm:hidden">Mine</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="favorites" 
                  className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200 col-span-1 sm:col-span-1"
                >
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Favorites</span>
                  <span className="sm:hidden">Fav</span>
                  <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-1 rounded-full">{favorites.length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="profile" 
                  className="text-xs sm:text-sm py-2 px-2 sm:px-4 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 hover:bg-slate-100 transition-all duration-200 col-span-1 sm:col-span-1"
                >
                  <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="browse" className="space-y-4 sm:space-y-6">
              {/* Search and Filter */}
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                <CardHeader className="border-b border-slate-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-white dark:from-gray-800 dark:to-gray-800">
                  <CardTitle className="text-lg sm:text-xl text-orange-800 dark:text-orange-200 font-bold">Find Your Perfect Property</CardTitle>
                  <CardDescription className="text-orange-600 dark:text-orange-300">
                    Search through our extensive property listings
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 h-4 w-4" />
                      <Input
                        placeholder="Search properties, locations, or keywords..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-orange-200 focus:border-orange-500 focus:ring-orange-500 h-12 text-base"
                        data-testid="input-search"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Select 
                        value={mapFilters.type || 'all'} 
                        onValueChange={(value) => 
                          setMapFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value }))
                        }
                      >
                        <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500 h-11" data-testid="select-type-filter">
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
                        <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500 h-11" data-testid="select-listing-filter">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {propertiesLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="animate-pulse shadow-lg">
                      <div className="aspect-[4/3] bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 rounded-t-lg"></div>
                      <CardContent className="p-3 sm:p-4">
                        <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="flex justify-between items-center mt-3">
                          <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-20"></div>
                          <div className="h-6 bg-slate-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : filteredProperties.length === 0 ? (
                  <div className="col-span-full p-8 sm:p-12 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                        <Home className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {searchTerm ? 'No Properties Found' : 'No Properties Available'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {searchTerm 
                          ? `No properties match your search for "${searchTerm}". Try adjusting your filters.`
                          : 'There are no properties available at the moment. Check back later for new listings.'
                        }
                      </p>
                      {searchTerm && (
                        <Button 
                          variant="outline" 
                          className="border-orange-200 text-orange-600 hover:bg-orange-50 transition-all duration-200"
                          onClick={() => setSearchTerm('')}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Clear Search
                        </Button>
                      )}
                    </div>
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

            <TabsContent value="add-property" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{editingProperty ? 'Update Property' : 'Add New Property'}</CardTitle>
                  <CardDescription>
                    {editingProperty ? 'Update your property details' : 'Share your property with others by adding it to our platform'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...propertyForm}>
                    <form onSubmit={propertyForm.handleSubmit(onSubmitProperty)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={propertyForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Title *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Beautiful 3-bedroom villa" {...field} data-testid="input-property-title" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Type *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-property-type">
                                    <SelectValue placeholder="Select property type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="house">
                                    <span className="flex items-center gap-2">
                                      <Home className="h-4 w-4 text-orange-600" />
                                      House
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="apartment">
                                    <span className="flex items-center gap-2">
                                      <Building className="h-4 w-4 text-orange-600" />
                                      Apartment
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="villa">
                                    <span className="flex items-center gap-2">
                                      <University className="h-4 w-4 text-orange-600" />
                                      Villa
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="land">
                                    <span className="flex items-center gap-2">
                                      <Mountain className="h-4 w-4 text-orange-600" />
                                      Land
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="listingType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Listing Type *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-listing-type">
                                    <SelectValue placeholder="Select listing type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="sale">
                                    <span className="flex items-center gap-2">
                                      <Tag className="h-4 w-4 text-green-600" />
                                      For Sale
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="rent">
                                    <span className="flex items-center gap-2">
                                      <Key className="h-4 w-4 text-orange-600" />
                                      For Rent
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (USD) *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., 150000" 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  data-testid="input-price" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="area"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Area (sq ft) *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., 1200" 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="input-area"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="bedrooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bedrooms</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., 3" 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="input-bedrooms"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="bathrooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bathrooms</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., 2" 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="input-bathrooms"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 123 Main Street" {...field} data-testid="input-address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Erbil" {...field} data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Iraq" {...field} data-testid="input-country" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input 
                                    placeholder="e.g., +964 750 123 4567" 
                                    {...field} 
                                    className="pl-10"
                                    data-testid="input-contact-phone" 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">
                                This phone number will be shown to interested buyers for WhatsApp and calls
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Location Selection Map */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">📍 Select Property Location</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Click on the map to pinpoint your property's exact location. We'll automatically fill in the address, city, and country fields for you!
                          </p>
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800 mb-4">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                Smart Auto-Fill Enabled
                              </span>
                            </div>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              Address details will be automatically detected and filled when you click on the map
                            </p>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                          <LocationSelectionMap 
                            onLocationSelect={handleLocationSelect}
                            selectedLocation={selectedLocation}
                            className="h-[400px] w-full"
                          />
                        </div>
                        
                        {selectedLocation && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                Location Selected
                              </span>
                            </div>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Property Images Upload */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">📷 Property Images</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload high-quality images of your property. The first image will be used as the main photo.
                          </p>
                        </div>
                        
                        <FormField
                          control={propertyForm.control}
                          name="images"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <ImageUpload
                                  value={field.value || []}
                                  onChange={field.onChange}
                                  maxFiles={10}
                                  maxSize={5}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Amenities and Features */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={propertyForm.control}
                          name="amenities"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amenities</FormLabel>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {[
                                  'Swimming Pool', 'Garden', 'Parking', 'Security System',
                                  'Elevator', 'Gym', 'Balcony', 'Terrace'
                                ].map((amenity) => (
                                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={field.value?.includes(amenity) || false}
                                      onChange={(e) => {
                                        const current = field.value || [];
                                        if (e.target.checked) {
                                          field.onChange([...current, amenity]);
                                        } else {
                                          field.onChange(current.filter(item => item !== amenity));
                                        }
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">{amenity}</span>
                                  </label>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={propertyForm.control}
                          name="features"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Features</FormLabel>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {[
                                  'Air Conditioning', 'Heating', 'Furnished', 'Pet Friendly',
                                  'Fireplace', 'High Ceilings', 'Modern Kitchen', 'Storage Room'
                                ].map((feature) => (
                                  <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={field.value?.includes(feature) || false}
                                      onChange={(e) => {
                                        const current = field.value || [];
                                        if (e.target.checked) {
                                          field.onChange([...current, feature]);
                                        } else {
                                          field.onChange(current.filter(item => item !== feature));
                                        }
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <span className="text-sm">{feature}</span>
                                  </label>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={propertyForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your property in detail..."
                                className="min-h-[100px]"
                                {...field}
                                data-testid="textarea-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-4">
                        {editingProperty && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleCancelPropertyEdit}
                            data-testid="button-cancel-edit"
                          >
                            Cancel
                          </Button>
                        )}
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => propertyForm.reset()}
                          data-testid="button-reset"
                        >
                          Reset Form
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createPropertyMutation.isPending || editPropertyMutation.isPending}
                          data-testid="button-submit-property"
                        >
                          {editingProperty ? 
                            (editPropertyMutation.isPending ? 'Updating Property...' : 'Update Property') : 
                            (createPropertyMutation.isPending ? 'Adding Property...' : 'Add Property')
                          }
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-properties" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Properties</CardTitle>
                  <CardDescription>
                    Manage the properties you've posted ({userProperties.length} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userPropertiesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
                          <CardContent className="p-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : userProperties.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>You haven't posted any properties yet.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab('add-property')}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Property
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userProperties.map((property) => (
                        <Card key={property.id} className="group relative">
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
                              <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleEditProperty(property)}
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                  data-testid={`button-edit-${property.id}`}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteProperty(property.id, property.title)}
                                  data-testid={`button-delete-${property.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="absolute top-2 left-2">
                                <Badge variant={property.listingType === 'sale' ? 'default' : 'secondary'}>
                                  {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                                </Badge>
                              </div>
                              <div className="absolute bottom-2 left-2">
                                <Badge variant="outline" className="text-xs bg-white/90">
                                  {property.status}
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
                                  <p className="text-xs text-muted-foreground">
                                    Posted {new Date(property.createdAt || '').toLocaleDateString()}
                                  </p>
                                </div>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/property/${property.id}`)}
                                  data-testid={`button-view-${property.id}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
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
                    {/* Profile Picture and Basic Info */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.avatar || ''} alt="Profile photo" />
                        <AvatarFallback className="text-lg">
                          {user?.firstName?.[0]}{user?.lastName?.[0] || user?.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        <Badge variant="secondary" className="mt-1">Customer</Badge>
                      </div>
                      <div className="flex space-x-2">
                        {!isEditingProfile ? (
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditingProfile(true)}
                            data-testid="button-edit-profile"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              onClick={handleCancelEdit}
                              data-testid="button-cancel-edit"
                            >
                              Cancel
                            </Button>
                            <Button 
                              form="profile-form"
                              type="submit" 
                              disabled={updateProfileMutation.isPending}
                              data-testid="button-save-profile"
                            >
                              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Profile Form */}
                    {isEditingProfile ? (
                      <Form {...profileForm}>
                        <form 
                          id="profile-form"
                          onSubmit={profileForm.handleSubmit(onSubmitProfile)} 
                          className="space-y-6"
                        >
                          {/* Profile Photo Upload */}
                          <FormField
                            control={profileForm.control}
                            name="avatar"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <ProfilePhotoUpload
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    currentUser={user || undefined}
                                    maxSize={2}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Editable Fields */}
                            <FormField
                              control={profileForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your first name" 
                                      {...field} 
                                      data-testid="input-first-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your last name" 
                                      {...field} 
                                      data-testid="input-last-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Enter your phone number" 
                                      {...field} 
                                      data-testid="input-phone"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Read-only Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Username</label>
                              <Input value={user?.username || ''} disabled />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Email</label>
                              <Input value={user?.email || ''} disabled />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Member Since</label>
                              <Input value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} disabled />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Account Type</label>
                              <Input value="Customer" disabled />
                            </div>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      /* Read-only View */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">First Name</label>
                          <Input value={user?.firstName || 'Not provided'} disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Last Name</label>
                          <Input value={user?.lastName || 'Not provided'} disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Phone</label>
                          <Input value={user?.phone || 'Not provided'} disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Username</label>
                          <Input value={user?.username || ''} disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <Input value={user?.email || ''} disabled />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Member Since</label>
                          <Input value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''} disabled />
                        </div>
                      </div>
                    )}
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