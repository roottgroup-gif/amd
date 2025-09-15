import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Property } from '@/types';

interface PropertyEventOptions {
  currentFilters?: Record<string, any>;
  onPropertyCreated?: (property: Property) => void;
  onPropertyUpdated?: (property: Property) => void;
  onPropertyDeleted?: (propertyId: string) => void;
}

export function usePropertyEvents(options: PropertyEventOptions = {}) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentFiltersRef = useRef<Record<string, any> | undefined>();
  const callbacksRef = useRef<{
    onPropertyCreated?: (property: Property) => void;
    onPropertyUpdated?: (property: Property) => void;
    onPropertyDeleted?: (propertyId: string) => void;
  }>({});
  const { currentFilters, onPropertyCreated, onPropertyUpdated, onPropertyDeleted } = options;

  // Update refs without triggering reconnection
  currentFiltersRef.current = currentFilters;
  callbacksRef.current = { onPropertyCreated, onPropertyUpdated, onPropertyDeleted };

  useEffect(() => {
    // Create EventSource connection only once
    const eventSource = new EventSource('/api/properties/stream');
    eventSourceRef.current = eventSource;

    // Helper functions for handling events
    const handlePropertyCreated = (property: Property) => {
      console.log('🔄 Handling property created - invalidating queries and forcing refetch');
      
      // Aggressively invalidate and refetch all property-related queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties'],
        refetchType: 'all'
      });

      // Force immediate refetch to bypass any caching
      queryClient.refetchQueries({ 
        queryKey: ['/api/properties']
      });

      // If we have current filters, also invalidate the specific filtered query
      if (currentFiltersRef.current) {
        const normalizedFilters = Object.fromEntries(
          Object.entries(currentFiltersRef.current)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .sort(([a], [b]) => a.localeCompare(b))
        );
        
        queryClient.invalidateQueries({ 
          queryKey: ['/api/properties', normalizedFilters],
          refetchType: 'all'
        });

        queryClient.refetchQueries({ 
          queryKey: ['/api/properties', normalizedFilters]
        });
      }

      // Invalidate featured properties
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties/featured'],
        refetchType: 'all'
      });

      // Call custom callback if provided
      callbacksRef.current.onPropertyCreated?.(property);
    };

    const handlePropertyUpdated = (property: Property) => {
      console.log('🔄 Handling property updated - invalidating queries and forcing refetch');
      
      // Aggressively invalidate and refetch all property-related queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties'],
        refetchType: 'all'
      });

      queryClient.refetchQueries({ 
        queryKey: ['/api/properties']
      });

      // Invalidate specific property query
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties', property.id],
        refetchType: 'all'
      });

      // If we have current filters, also invalidate the specific filtered query
      if (currentFiltersRef.current) {
        const normalizedFilters = Object.fromEntries(
          Object.entries(currentFiltersRef.current)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .sort(([a], [b]) => a.localeCompare(b))
        );
        
        queryClient.invalidateQueries({ 
          queryKey: ['/api/properties', normalizedFilters],
          refetchType: 'all'
        });

        queryClient.refetchQueries({ 
          queryKey: ['/api/properties', normalizedFilters]
        });
      }

      // Call custom callback if provided
      callbacksRef.current.onPropertyUpdated?.(property);
    };

    const handlePropertyDeleted = (data: any) => {
      const propertyId = data.propertyId || data.id;
      console.log('🔄 Handling property deleted - invalidating queries and forcing refetch');
      
      // Aggressively invalidate and refetch all property-related queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/properties'],
        refetchType: 'all'
      });

      queryClient.refetchQueries({ 
        queryKey: ['/api/properties']
      });

      // Remove specific property from cache
      queryClient.removeQueries({ 
        queryKey: ['/api/properties', propertyId] 
      });

      // If we have current filters, also invalidate the specific filtered query
      if (currentFiltersRef.current) {
        const normalizedFilters = Object.fromEntries(
          Object.entries(currentFiltersRef.current)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .sort(([a], [b]) => a.localeCompare(b))
        );
        
        queryClient.invalidateQueries({ 
          queryKey: ['/api/properties', normalizedFilters],
          refetchType: 'all'
        });

        queryClient.refetchQueries({ 
          queryKey: ['/api/properties', normalizedFilters]
        });
      }

      // Call custom callback if provided
      callbacksRef.current.onPropertyDeleted?.(propertyId);
    };

    // Handle connection established
    eventSource.onopen = () => {
      console.log('✅ SSE connection established and ready');
    };

    // Handle messages
    eventSource.onmessage = (event) => {
      console.log('📨 SSE Raw message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('📨 SSE Parsed message:', data);
        
        if (data.type === 'connected') {
          console.log('✅ SSE connected:', data.message);
        } else if (data.type === 'heartbeat') {
          // Handle heartbeat - just keep connection alive
          console.log('💓 SSE heartbeat received');
        } else if (data.type === 'property_created') {
          // Handle property created via onmessage as fallback
          console.log('🏠 New property created - forcing immediate map update:', data.title);
          handlePropertyCreated(data);
          // Force immediate refetch to bypass polling delay
          queryClient.refetchQueries({ queryKey: ['/api/properties'] });
        } else if (data.type === 'property_updated') {
          // Handle property updated via onmessage as fallback
          console.log('🔄 Property updated - forcing immediate map update:', data.title);
          handlePropertyUpdated(data);
          // Force immediate refetch to bypass polling delay
          queryClient.refetchQueries({ queryKey: ['/api/properties'] });
        } else if (data.type === 'property_deleted') {
          // Handle property deleted via onmessage as fallback
          console.log('🗑️ Property deleted - forcing immediate map update:', data.title || data.id);
          handlePropertyDeleted(data);
          // Force immediate refetch to bypass polling delay
          queryClient.refetchQueries({ queryKey: ['/api/properties'] });
        } else {
          console.log('❓ Unknown SSE message type:', data.type, data);
        }
      } catch (error) {
        console.error('❌ Error parsing SSE message:', error, 'Raw data:', event.data);
      }
    };

    // Handle custom events (primary path - fallback to onmessage if these don't fire)
    eventSource.addEventListener('property_created', (event) => {
      try {
        const property: Property = JSON.parse((event as MessageEvent).data);
        console.log('🏠 New property created and detected (via addEventListener):', property.title);
        handlePropertyCreated(property);
      } catch (error) {
        console.error('❌ Error handling property_created event:', error);
      }
    });

    eventSource.addEventListener('property_updated', (event) => {
      try {
        const property: Property = JSON.parse((event as MessageEvent).data);
        console.log('🔄 Property updated and detected (via addEventListener):', property.title);
        handlePropertyUpdated(property);
      } catch (error) {
        console.error('❌ Error handling property_updated event:', error);
      }
    });

    eventSource.addEventListener('property_deleted', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        console.log('🗑️ Property deleted and detected (via addEventListener):', data.title || data.id);
        handlePropertyDeleted(data);
      } catch (error) {
        console.error('❌ Error handling property_deleted event:', error);
      }
    });

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      
      // The browser will automatically attempt to reconnect
      // but we can add custom reconnection logic here if needed
    };

    // Cleanup on unmount
    return () => {
      console.log('Closing SSE connection');
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [queryClient]); // Removed currentFilters and callbacks to prevent unnecessary reconnections

  // Return connection status
  const isConnected = eventSourceRef.current?.readyState === EventSource.OPEN;
  const isConnecting = eventSourceRef.current?.readyState === EventSource.CONNECTING;

  return {
    isConnected,
    isConnecting,
    eventSource: eventSourceRef.current
  };
}