import { useQuery } from "@tanstack/react-query";

// Supported currencies with their symbols
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: "$", name: "US Dollar" },
  IQD: { symbol: "IQD", name: "Iraqi Dinar" },
  AED: { symbol: "AED", name: "UAE Dirham" },
  EUR: { symbol: "€", name: "Euro" }
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

// Get user's preferred currency from localStorage with fallback to USD
export function getUserPreferredCurrency(): SupportedCurrency {
  if (typeof window === 'undefined') return 'USD';
  const stored = localStorage.getItem('preferredCurrency') as SupportedCurrency;
  return stored && stored in SUPPORTED_CURRENCIES ? stored : 'USD';
}

// Set user's preferred currency in localStorage
export function setUserPreferredCurrency(currency: SupportedCurrency): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('preferredCurrency', currency);
}

// Hook to get currency conversion rate
export function useCurrencyConversion(fromCurrency: string, toCurrency: string) {
  return useQuery({
    queryKey: ['currency-conversion', fromCurrency, toCurrency],
    queryFn: async () => {
      // If same currency, no conversion needed
      if (fromCurrency === toCurrency) {
        return { rate: 1, convertedAmount: 0 };
      }

      const response = await fetch(
        `/api/currency/convert?amount=1&from=${fromCurrency}&to=${toCurrency}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversion rate');
      }
      
      return response.json();
    },
    enabled: fromCurrency !== toCurrency,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Convert price from one currency to another
export async function convertPrice(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const response = await fetch(
      `/api/currency/convert?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`
    );
    
    if (!response.ok) {
      console.warn(`Currency conversion failed for ${fromCurrency} to ${toCurrency}`);
      return amount; // Fallback to original amount
    }
    
    const data = await response.json();
    return data.convertedAmount;
  } catch (error) {
    console.warn('Currency conversion error:', error);
    return amount; // Fallback to original amount
  }
}

// Enhanced formatPrice function with currency conversion support
export function formatPrice(
  price: string,
  originalCurrency: string,
  listingType: string,
  displayCurrency?: string,
  convertedAmount?: number,
  t?: (key: string) => string
) {
  const amount = convertedAmount ?? parseFloat(price);
  const currency = displayCurrency || originalCurrency;
  
  // Get currency symbol
  const currencyInfo = SUPPORTED_CURRENCIES[currency as SupportedCurrency];
  const symbol = currencyInfo?.symbol || currency;
  
  // Format number with proper locale
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  // Add suffix for rent
  const suffix = listingType === "rent" ? (t?.('property.perMonth') || "/month") : "";
  
  // Show conversion indicator if converted
  const conversionIndicator = displayCurrency && displayCurrency !== originalCurrency 
    ? ` (${originalCurrency})` 
    : "";
  
  return `${symbol}${formattedAmount}${suffix}${conversionIndicator}`;
}

// Format price per square foot/meter
export function formatPricePerUnit(
  price: string,
  area: number,
  originalCurrency: string,
  displayCurrency?: string,
  convertedAmount?: number,
  t?: (key: string) => string
) {
  const amount = convertedAmount ?? parseFloat(price);
  const currency = displayCurrency || originalCurrency;
  
  const currencyInfo = SUPPORTED_CURRENCIES[currency as SupportedCurrency];
  const symbol = currencyInfo?.symbol || currency;
  
  const pricePerUnit = Math.round(amount / area);
  const unitText = t?.('property.perSqFt') || "/sq ft";
  
  return `${symbol}${pricePerUnit}${unitText}`;
}