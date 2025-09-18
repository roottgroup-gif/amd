import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SupportedCurrency, getUserPreferredCurrency, setUserPreferredCurrency } from './currency';

interface CurrencyContextType {
  preferredCurrency: SupportedCurrency;
  setPreferredCurrency: (currency: SupportedCurrency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [preferredCurrency, setPreferredCurrencyState] = useState<SupportedCurrency>('USD');
  const queryClient = useQueryClient();

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = getUserPreferredCurrency();
    setPreferredCurrencyState(stored);
  }, []);

  const setPreferredCurrency = (currency: SupportedCurrency) => {
    // Update local state
    setPreferredCurrencyState(currency);
    
    // Update localStorage
    setUserPreferredCurrency(currency);
    
    // Invalidate all currency conversion queries to trigger refetch
    queryClient.invalidateQueries({ 
      queryKey: ['currency-conversion'],
      exact: false 
    });
  };

  const value = {
    preferredCurrency,
    setPreferredCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}