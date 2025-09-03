import { useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import PropertyCard from "@/components/property-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/lib/i18n";
import { useAgentProperties, useCreateProperty, useUpdateProperty, useDeleteProperty, useAgentInquiries, useUpdateInquiryStatus } from "@/hooks/use-properties";
import { useToast } from "@/hooks/use-toast";
import type { Property, Inquiry } from "@/types";
import { 
  Home, TrendingUp, Mail, DollarSign, Plus, Edit, Trash2, 
  BarChart3, Eye, Clock, MessageSquare, Phone, User, MapPin,
  Calendar
} from "lucide-react";

export default function AgentDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [agentId] = useState("demo-agent-id"); // In real app, get from auth context
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const { data: properties, isLoading: propertiesLoading } = useAgentProperties(agentId);
  const { data: inquiries, isLoading: inquiriesLoading } = useAgentInquiries(agentId);
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();
  const updateInquiryStatus = useUpdateInquiryStatus();

  const [newProperty, setNewProperty] = useState({
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
    images: [] as string[],
    amenities: [] as string[],
    features: [] as string[],
    agentId: agentId
  });

  // Calculate dashboard statistics
  const stats = {
    totalProperties: properties?.length || 0,
    activeListings: properties?.filter(p => p.status === 'active').length || 0,
    newInquiries: inquiries?.filter(i => i.status === 'pending').length || 0,
    monthlySales: '850k' // This would come from a more complex calculation
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createProperty.mutateAsync({
        ...newProperty,
        listingType: newProperty.listingType as "sale" | "rent",
        price: newProperty.price,
        bedrooms: newProperty.bedrooms || undefined,
        bathrooms: newProperty.bathrooms || undefined,
        area: newProperty.area || undefined,
      });
      
      toast({
        title: "Property Created",
        description: "Your property has been successfully listed.",
      });
      
      setIsCreateModalOpen(false);
      setNewProperty({
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
        images: [],
        amenities: [],
        features: [],
        agentId: agentId
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create property. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setNewProperty({
      title: property.title,
      description: property.description || '',
      type: property.type,
      listingType: property.listingType,
      price: property.price,
      currency: property.currency,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      area: property.area || 0,
      address: property.address,
      city: property.city,
      country: property.country,
      images: property.images,
      amenities: property.amenities,
      features: property.features,
      agentId: agentId
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    
    try {
      await updateProperty.mutateAsync({
        id: selectedProperty.id,
        ...newProperty,
        listingType: newProperty.listingType as "sale" | "rent",
        price: newProperty.price,
        bedrooms: newProperty.bedrooms || undefined,
        bathrooms: newProperty.bathrooms || undefined,
        area: newProperty.area || undefined,
      });
      
      toast({
        title: "Property Updated",
        description: "Your property has been successfully updated.",
      });
      
      setIsEditModalOpen(false);
      setSelectedProperty(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update property. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    
    try {
      await deleteProperty.mutateAsync(propertyId);
      toast({
        title: "Property Deleted",
        description: "Property has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInquiryStatusUpdate = async (inquiryId: string, status: string) => {
    try {
      await updateInquiryStatus.mutateAsync({ id: inquiryId, status });
      toast({
        title: "Inquiry Updated",
        description: `Inquiry marked as ${status}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inquiry status.",
        variant: "destructive",
      });
    }
  };

  const PropertyForm = () => (
    <form onSubmit={isEditModalOpen ? handleUpdateProperty : handleCreateProperty} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Property Title *</label>
          <Input
            value={newProperty.title}
            onChange={(e) => setNewProperty({...newProperty, title: e.target.value})}
            placeholder="Enter property title"
            required
            data-testid="property-title-input"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Property Type *</label>
          <Select 
            value={newProperty.type} 
            onValueChange={(value) => setNewProperty({...newProperty, type: value})}
          >
            <SelectTrigger data-testid="property-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="land">Land</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Listing Type *</label>
          <Select 
            value={newProperty.listingType} 
            onValueChange={(value) => setNewProperty({...newProperty, listingType: value as "sale" | "rent"})}
          >
            <SelectTrigger data-testid="listing-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">For Sale</SelectItem>
              <SelectItem value="rent">For Rent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Price *</label>
          <Input
            type="number"
            value={newProperty.price}
            onChange={(e) => setNewProperty({...newProperty, price: e.target.value})}
            placeholder="Enter price"
            required
            data-testid="property-price-input"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Bedrooms</label>
          <Input
            type="number"
            value={newProperty.bedrooms || ''}
            onChange={(e) => setNewProperty({...newProperty, bedrooms: parseInt(e.target.value) || 0})}
            placeholder="Number of bedrooms"
            data-testid="property-bedrooms-input"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Bathrooms</label>
          <Input
            type="number"
            value={newProperty.bathrooms || ''}
            onChange={(e) => setNewProperty({...newProperty, bathrooms: parseInt(e.target.value) || 0})}
            placeholder="Number of bathrooms"
            data-testid="property-bathrooms-input"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Area (sq ft)</label>
          <Input
            type="number"
            value={newProperty.area || ''}
            onChange={(e) => setNewProperty({...newProperty, area: parseInt(e.target.value) || 0})}
            placeholder="Property area"
            data-testid="property-area-input"
          />
        </div>

        <div>
          <label className="text-sm font-medium">City *</label>
          <Input
            value={newProperty.city}
            onChange={(e) => setNewProperty({...newProperty, city: e.target.value})}
            placeholder="Enter city"
            required
            data-testid="property-city-input"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Address *</label>
        <Input
          value={newProperty.address}
          onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
          placeholder="Enter full address"
          required
          data-testid="property-address-input"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={newProperty.description}
          onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
          placeholder="Enter property description"
          rows={4}
          data-testid="property-description-input"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createProperty.isPending || updateProperty.isPending}
          data-testid="submit-property-button"
        >
          {createProperty.isPending || updateProperty.isPending ? 'Saving...' : (isEditModalOpen ? 'Update Property' : 'Create Property')}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" data-testid="dashboard-title">Agent Dashboard</h1>
              <p className="text-muted-foreground">Manage your properties and client inquiries</p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center" data-testid="add-property-button">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                </DialogHeader>
                <PropertyForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Properties</p>
                  <p className="text-2xl font-bold" data-testid="total-properties-stat">{stats.totalProperties}</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Home className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-2xl font-bold" data-testid="active-listings-stat">{stats.activeListings}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Inquiries</p>
                  <p className="text-2xl font-bold" data-testid="new-inquiries-stat">{stats.newInquiries}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold" data-testid="monthly-sales-stat">${stats.monthlySales}</p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Properties Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Your Properties
                <Badge variant="secondary">{stats.totalProperties} Total</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                      <div className="w-16 h-16 bg-muted rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : properties && properties.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {properties.map((property) => (
                    <div key={property.id} className="flex items-center space-x-4 p-4 border rounded-lg" data-testid={`property-item-${property.id}`}>
                      <img 
                        src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100'}
                        alt={property.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{property.title}</h4>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {property.city}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                            {property.status}
                          </Badge>
                          <span className="text-sm font-medium text-primary">
                            ${parseFloat(property.price).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditProperty(property)}
                          data-testid={`edit-property-${property.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteProperty(property.id)}
                          data-testid={`delete-property-${property.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No properties listed yet.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsCreateModalOpen(true)}
                    data-testid="create-first-property-button"
                  >
                    Create Your First Property
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Inquiries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Inquiries
                <Badge variant="secondary">{stats.newInquiries} Pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inquiriesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="flex justify-between mb-2">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-full mb-3"></div>
                      <div className="h-6 bg-muted rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : inquiries && inquiries.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {inquiries.map((inquiry) => (
                    <div key={inquiry.id} className="p-4 border rounded-lg" data-testid={`inquiry-item-${inquiry.id}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {inquiry.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-sm">{inquiry.name}</h4>
                            <p className="text-xs text-muted-foreground">{inquiry.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={inquiry.status === 'pending' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {inquiry.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {new Date(inquiry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {inquiry.message}
                      </p>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleInquiryStatusUpdate(inquiry.id, 'replied')}
                          disabled={inquiry.status === 'replied'}
                          data-testid={`reply-inquiry-${inquiry.id}`}
                        >
                          Mark as Replied
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleInquiryStatusUpdate(inquiry.id, 'closed')}
                          disabled={inquiry.status === 'closed'}
                          data-testid={`close-inquiry-${inquiry.id}`}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No inquiries yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Inquiries will appear here when potential clients contact you.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Property Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
          </DialogHeader>
          <PropertyForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}
