import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { CurrencyRate } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

// Type definitions for the forms
export interface CreateCurrencyRateForm {
  toCurrency: string;
  rate: string;
  isActive?: boolean;
}

export interface UpdateCurrencyRateForm {
  rate: string;
  isActive?: boolean;
}

// Hook to fetch all currency rates (super admin only)
export function useCurrencyRates() {
  return useQuery<CurrencyRate[]>({
    queryKey: ['/api/admin/currency-rates'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/currency-rates');
      return await response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch active currency rates only
export function useActiveCurrencyRates() {
  return useQuery<CurrencyRate[]>({
    queryKey: ['/api/admin/currency-rates/active'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/currency-rates/active');
      return await response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to create a new currency rate
export function useCreateCurrencyRate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateCurrencyRateForm) => {
      const response = await apiRequest('POST', '/api/admin/currency-rates', {
        fromCurrency: 'USD', // Always USD as base
        toCurrency: data.toCurrency,
        rate: data.rate,
        isActive: data.isActive ?? true,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currency-rates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currency-rates/active'] });
      toast({
        title: 'Success',
        description: 'Currency exchange rate created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create currency rate',
        variant: 'destructive',
      });
    },
  });
}

// Hook to update an existing currency rate
export function useUpdateCurrencyRate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCurrencyRateForm }) => {
      const response = await apiRequest('PUT', `/api/admin/currency-rates/${id}`, {
        rate: data.rate,
        isActive: data.isActive,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currency-rates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currency-rates/active'] });
      toast({
        title: 'Success',
        description: 'Currency exchange rate updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update currency rate',
        variant: 'destructive',
      });
    },
  });
}

// Hook to delete/deactivate a currency rate
export function useDeleteCurrencyRate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/currency-rates/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currency-rates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/currency-rates/active'] });
      toast({
        title: 'Success',
        description: 'Currency exchange rate deactivated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate currency rate',
        variant: 'destructive',
      });
    },
  });
}