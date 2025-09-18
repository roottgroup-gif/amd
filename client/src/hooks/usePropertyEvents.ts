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
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { currentFilters, onPropertyCreated, onPropertyUpdated, onPropertyDeleted } = options;

  // Update refs without triggering reconnection
  currentFiltersRef.current = currentFilters;
  callbacksRef.current = { onPropertyCreated, onPropertyUpdated, onPropertyDeleted };

  useEffect(() => {
    const maxReconnectAttempts = 10;
    let isCleaningUp = false;

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

    const createConnection = () => {
      if (isCleaningUp) return;

      // Clean up any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create EventSource connection
      const eventSource = new EventSource('/api/properties/stream');
      eventSourceRef.current = eventSource;

      // Handle connection established
      eventSource.onopen = () => {
        console.log('✅ SSE connection established and ready');
        console.log('📊 EventSource readyState:', eventSource.readyState);
        // Reset reconnect attempts on successful connection
        reconnectAttemptsRef.current = 0;
      };

      // Handle messages - only for system messages like heartbeat and connected
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
          } else {
            console.log('❓ Unknown SSE message type:', data.type || data.eventType, data);
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

      // Enhanced error handling with exponential backoff reconnection
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        
        // Close current connection
        eventSource.close();
        eventSourceRef.current = null;

        // Don't reconnect if we're cleaning up
        if (isCleaningUp) return;

        // Implement exponential backoff reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          console.log(`🔄 Attempting to reconnect SSE (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${delay}ms`);
          
          // Clear any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isCleaningUp) {
              createConnection();
            }
          }, delay);
        } else {
          console.error('❌ Maximum SSE reconnection attempts reached. Giving up.');
        }
      };
    };

    // Initialize connection
    createConnection();

    // Cleanup on unmount
    return () => {
      console.log('Closing SSE connection');
      isCleaningUp = true;
      
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
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