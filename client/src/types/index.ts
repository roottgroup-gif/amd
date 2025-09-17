export interface Property {
  id: string;
  title: string;
  description?: string;
  type: string;
  listingType: "sale" | "rent";
  price: string;
  currency: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  address: string;
  city: string;
  country: string;
  latitude?: string;
  longitude?: string;
  images: string[];
  amenities: string[];
  features: string[];
  status: string;
  language: string;
  agentId?: string;
  views: number;
  isFeatured: boolean;
  slug?: string;
  createdAt: string;
  updatedAt: string;
  agent?: User;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface PropertyFilters {
  type?: string;
  listingType?: "sale" | "rent";
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  country?: string;
  language?: "en" | "ar" | "kur";
  features?: string[];
  search?: string;
  sortBy?: "price" | "date" | "views";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface AISearchResponse {
  query: string;
  filters: Record<string, any>;
  results: Property[];
  count: number;
}
