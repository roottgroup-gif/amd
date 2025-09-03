import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Property, PropertyFilters, AISearchResponse, Inquiry } from "@/types";

export function useProperties(filters?: PropertyFilters) {
  return useQuery<Property[]>({
    queryKey: ["/api/properties", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }
      const url = `/api/properties${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
  });
}

export function useFeaturedProperties() {
  return useQuery<Property[]>({
    queryKey: ["/api/properties/featured"],
  });
}

export function useProperty(id: string) {
  return useQuery<Property>({
    queryKey: ["/api/properties", id],
    enabled: !!id,
  });
}

export function useAgentProperties(agentId: string) {
  return useQuery<Property[]>({
    queryKey: ["/api/agents", agentId, "properties"],
    enabled: !!agentId,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (property: Partial<Property>) => {
      const response = await apiRequest("POST", "/api/properties", property);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...property }: Partial<Property> & { id: string }) => {
      const response = await apiRequest("PUT", `/api/properties/${id}`, property);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", data.id] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/properties/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });
}

export function useAISearch() {
  return useMutation<AISearchResponse, Error, { query: string; userId?: string }>({
    mutationFn: async ({ query, userId }) => {
      const response = await apiRequest("POST", "/api/search/ai", { query, userId });
      return response.json();
    },
  });
}

export function useSearchSuggestions() {
  return useQuery<string[]>({
    queryKey: ["/api/search/suggestions"],
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inquiry: Partial<Inquiry>) => {
      const response = await apiRequest("POST", "/api/inquiries", inquiry);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
    },
  });
}

export function useAgentInquiries(agentId: string) {
  return useQuery<Inquiry[]>({
    queryKey: ["/api/agents", agentId, "inquiries"],
    enabled: !!agentId,
  });
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/inquiries/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
    },
  });
}

export function useFavorites(userId: string) {
  return useQuery<Property[]>({
    queryKey: ["/api/users", userId, "favorites"],
    enabled: !!userId,
  });
}

export function useAddToFavorites() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, propertyId }: { userId: string; propertyId: string }) => {
      const response = await apiRequest("POST", "/api/favorites", { userId, propertyId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });
}

export function useRemoveFromFavorites() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, propertyId }: { userId: string; propertyId: string }) => {
      const response = await apiRequest("DELETE", "/api/favorites", { userId, propertyId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });
}

export function useIsFavorite(userId: string, propertyId: string) {
  return useQuery<{ isFavorite: boolean }>({
    queryKey: ["/api/favorites/check", { userId, propertyId }],
    enabled: !!userId && !!propertyId,
    queryFn: async () => {
      const response = await fetch(`/api/favorites/check?userId=${userId}&propertyId=${propertyId}`);
      if (!response.ok) throw new Error('Failed to check favorite status');
      return response.json();
    },
  });
}
