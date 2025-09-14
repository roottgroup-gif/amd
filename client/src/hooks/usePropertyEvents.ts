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

    // Handle connection established
    eventSource.onopen = () => {
      console.log('SSE connection established');
    };

    // Handle messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('SSE connected:', data.message);
        } else if (data.type === 'heartbeat') {
          // Handle heartbeat - just keep connection alive
          console.debug('SSE heartbeat received');
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    // Handle custom events
    eventSource.addEventListener('property_created', (event) => {
      try {
        const property: Property = JSON.parse((event as MessageEvent).data);
        console.log('🏠 New property created and detected:', property.title);

        // Invalidate properties queries to trigger refetch
        queryClient.invalidateQueries({ 
          queryKey: ['/api/properties'] 
        });

        // If we have current filters, also invalidate the specific filtered query
        if (currentFiltersRef.current) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/properties', currentFiltersRef.current] 
          });
        }

        // Invalidate featured properties
        queryClient.invalidateQueries({ 
          queryKey: ['/api/properties/featured'] 
        });

        // Call custom callback if provided
        callbacksRef.current.onPropertyCreated?.(property);
      } catch (error) {
        console.error('❌ Error handling property_created event:', error);
      }
    });

    eventSource.addEventListener('property_updated', (event) => {
      try {
        const property: Property = JSON.parse((event as MessageEvent).data);
        console.log('🔄 Property updated and detected:', property.title);

        // Invalidate properties queries
        queryClient.invalidateQueries({ 
          queryKey: ['/api/properties'] 
        });

        // Invalidate specific property query
        queryClient.invalidateQueries({ 
          queryKey: ['/api/properties', property.id] 
        });

        // If we have current filters, also invalidate the specific filtered query
        if (currentFiltersRef.current) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/properties', currentFiltersRef.current] 
          });
        }

        // Call custom callback if provided
        callbacksRef.current.onPropertyUpdated?.(property);
      } catch (error) {
        console.error('❌ Error handling property_updated event:', error);
      }
    });

    eventSource.addEventListener('property_deleted', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        const propertyId = data.propertyId || data.id;
        console.log('🗑️ Property deleted and detected:', data.title || propertyId);

        // Invalidate properties queries
        queryClient.invalidateQueries({ 
          queryKey: ['/api/properties'] 
        });

        // Remove specific property from cache
        queryClient.removeQueries({ 
          queryKey: ['/api/properties', propertyId] 
        });

        // If we have current filters, also invalidate the specific filtered query
        if (currentFiltersRef.current) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/properties', currentFiltersRef.current] 
          });
        }

        // Call custom callback if provided
        callbacksRef.current.onPropertyDeleted?.(propertyId);
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