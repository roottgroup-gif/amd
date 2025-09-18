import { useCurrency } from "@/lib/currency-context";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_CURRENCIES, SupportedCurrency } from "@/lib/currency";

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: SupportedCurrency) => void;
  className?: string;
}

export function CurrencySelector({ onCurrencyChange, className }: CurrencySelectorProps) {
  const { preferredCurrency, setPreferredCurrency } = useCurrency();

  const handleCurrencyChange = (currency: SupportedCurrency) => {
    setPreferredCurrency(currency);
    onCurrencyChange?.(currency);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`justify-between min-w-[120px] ${className}`}
          data-testid="currency-selector"
        >
          <span className="flex items-center gap-2">
            <span className="font-medium">
              {SUPPORTED_CURRENCIES[preferredCurrency].symbol}
            </span>
            <span className="text-sm text-muted-foreground">
              {preferredCurrency}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleCurrencyChange(code as SupportedCurrency)}
            className="flex items-center justify-between cursor-pointer"
            data-testid={`currency-option-${code.toLowerCase()}`}
          >
            <div className="flex items-center gap-3">
              <span className="font-medium w-8">{info.symbol}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{code}</span>
                <span className="text-xs text-muted-foreground">{info.name}</span>
              </div>
            </div>
            {preferredCurrency === code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}