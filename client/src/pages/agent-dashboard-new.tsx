import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import PropertyMap from '@/components/property-map';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PropertyWithAgent, PropertyFilters } from '@shared/schema';
import { 
  Building2, Plus, Edit, Trash2, LogOut, MapPin, DollarSign,
  Home, TrendingUp, Mail, BarChart3, Eye, Clock, MessageSquare,
  Phone, User, Calendar, Mountain, Tag, Key, Search, Filter,
  Upload, Save, X, Bed, Bath, Maximize, Navigation, Settings
} from 'lucide-react';

const propertySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['house', 'apartment', 'villa', 'land']),
  listingType: z.enum(['sale', 'rent']),
  price: z.string().min(1, 'Price is required'),
  currency: z.string().default('USD'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  area: z.number().int().min(1, 'Area is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().default('Iraq'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  amenities: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
});

type PropertyForm = z.infer<typeof propertySchema>;

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithAgent | null>(null);
  const [mapFilters, setMapFilters] = useState<PropertyFilters>({ limit: 100 });
  const [activeTab, setActiveTab] = useState('overview');

  const form = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
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
      amenities: [],
      features: [],
    },
  });

  // Fetch agent's properties
  const { data: agentProperties = [], isLoading: propertiesLoading } = useQuery<PropertyWithAgent[]>({
    queryKey: ['/api/agents', user?.id, 'properties'],
    enabled: !!user?.id,
  });

  // Fetch all properties for map
  const { data: allProperties = [] } = useQuery<PropertyWithAgent[]>({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties?limit=100');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });

  // Create property mutation
  const createPropertyMutation = useMutation({
    mutationFn: async (propertyData: PropertyForm) => {
      const response = await apiRequest('POST', '/api/properties', {
        ...propertyData,
        agentId: user?.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents', user?.id, 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Property created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create property',
        variant: 'destructive',
      });
    },
  });

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PropertyForm> }) => {
      const response = await apiRequest('PUT', `/api/properties/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents', user?.id, 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      setIsEditModalOpen(false);
      setSelectedProperty(null);
      form.reset();
      toast({
        title: 'Success',
        description: 'Property updated successfully',
      });
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
      queryClient.invalidateQueries({ queryKey: ['/api/agents', user?.id, 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
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

  const onCreateProperty = async (data: PropertyForm) => {
    await createPropertyMutation.mutateAsync(data);
  };

  const onUpdateProperty = async (data: PropertyForm) => {
    if (selectedProperty) {
      await updatePropertyMutation.mutateAsync({ 
        id: selectedProperty.id, 
        data 
      });
    }
  };

  const handleEditProperty = (property: PropertyWithAgent) => {
    setSelectedProperty(property);
    form.reset({
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
      latitude: property.latitude ? parseFloat(property.latitude) : undefined,
      longitude: property.longitude ? parseFloat(property.longitude) : undefined,
      amenities: property.amenities || [],
      features: property.features || [],
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteProperty = async (propertyId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      await deletePropertyMutation.mutateAsync(propertyId);
    }
  };

  const handleMapLocationSelect = (lat: number, lng: number) => {
    form.setValue('latitude', lat);
    form.setValue('longitude', lng);
  };

  // Statistics
  const stats = {
    totalProperties: agentProperties.length,
    activeProperties: agentProperties.filter(p => p.status === 'active').length,
    soldProperties: agentProperties.filter(p => p.status === 'sold').length,
    totalViews: agentProperties.reduce((sum, p) => sum + (p.views || 0), 0),
  };

  return (
    <ProtectedRoute requiredRole={['agent', 'admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Agent Dashboard
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">Real Estate Agent</p>
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
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="properties">My Properties</TabsTrigger>
              <TabsTrigger value="map">Property Map</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProperties}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeProperties}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Properties Sold</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.soldProperties}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalViews}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your property listings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-create-property">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Property
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Property</DialogTitle>
                          <DialogDescription>
                            Create a new property listing for the map
                          </DialogDescription>
                        </DialogHeader>
                        <PropertyForm 
                          form={form}
                          onSubmit={onCreateProperty}
                          onLocationSelect={handleMapLocationSelect}
                          isLoading={createPropertyMutation.isPending}
                          onCancel={() => setIsCreateModalOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="outline" onClick={() => setActiveTab('map')}>
                      <MapPin className="h-4 w-4 mr-2" />
                      View Map
                    </Button>
                    
                    <Button variant="outline" onClick={() => setActiveTab('analytics')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                      <CardTitle>My Properties</CardTitle>
                      <CardDescription>
                        Manage your property listings
                      </CardDescription>
                    </div>
                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-create-property">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Property
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Property</DialogTitle>
                          <DialogDescription>
                            Create a new property listing for the map
                          </DialogDescription>
                        </DialogHeader>
                        <PropertyForm 
                          form={form}
                          onSubmit={onCreateProperty}
                          onLocationSelect={handleMapLocationSelect}
                          isLoading={createPropertyMutation.isPending}
                          onCancel={() => setIsCreateModalOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {propertiesLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p>Loading properties...</p>
                    </div>
                  ) : agentProperties.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No properties found. Add your first property to get started.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {agentProperties.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          onEdit={handleEditProperty}
                          onDelete={handleDeleteProperty}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Map</CardTitle>
                  <CardDescription>
                    View and manage all properties on the interactive map
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[600px] w-full">
                    <PropertyMap 
                      properties={allProperties}
                      filters={mapFilters}
                      onFilterChange={setMapFilters}
                      onPropertyClick={(property) => {
                        if (property.agentId === user?.id) {
                          handleEditProperty(property);
                        }
                      }}
                      className="h-full w-full rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {agentProperties.slice(0, 5).map((property) => (
                        <div key={property.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{property.title}</p>
                            <p className="text-sm text-muted-foreground">{property.city}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{property.views || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm">New property added</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm">Property viewed 15 times</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                        <p className="text-sm">Price updated</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Edit Property Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property</DialogTitle>
              <DialogDescription>
                Update your property listing
              </DialogDescription>
            </DialogHeader>
            <PropertyForm 
              form={form}
              onSubmit={onUpdateProperty}
              onLocationSelect={handleMapLocationSelect}
              isLoading={updatePropertyMutation.isPending}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedProperty(null);
                form.reset();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

// Property Card Component
function PropertyCard({ 
  property, 
  onEdit, 
  onDelete 
}: { 
  property: PropertyWithAgent;
  onEdit: (property: PropertyWithAgent) => void;
  onDelete: (id: string, title: string) => void;
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
              <Building2 className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex space-x-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEdit(property)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`button-edit-${property.id}`}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(property.id, property.title)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`button-delete-${property.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
            <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
              {property.status}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
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
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                ${parseFloat(property.price).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {property.listingType === 'sale' ? 'for sale' : 'for rent'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Property Form Component
function PropertyForm({
  form,
  onSubmit,
  onLocationSelect,
  isLoading,
  onCancel,
}: {
  form: any;
  onSubmit: (data: PropertyForm) => void;
  onLocationSelect: (lat: number, lng: number) => void;
  isLoading: boolean;
  onCancel: () => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Title</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} data-testid="input-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="listingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Listing Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-listing-type">
                      <SelectValue placeholder="Select listing type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g., 150000"
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
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="IQD">IQD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bedrooms</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="0"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-bedrooms" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bathrooms</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="0"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-bathrooms" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area (sq ft)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="1"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-area" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-city" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-country" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    step="any"
                    placeholder="Click on map to set"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    data-testid="input-latitude" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    step="any"
                    placeholder="Click on map to set"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    data-testid="input-longitude" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            data-testid="button-submit"
          >
            {isLoading ? 'Saving...' : 'Save Property'}
          </Button>
        </div>
      </form>
    </Form>
  );
}