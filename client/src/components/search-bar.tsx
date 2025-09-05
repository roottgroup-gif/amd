import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { useAISearch, useSearchSuggestions } from "@/hooks/use-properties";
import { Search, Bot, Lightbulb } from "lucide-react";

interface SearchBarProps {
  onResults?: (results: any) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ onResults, placeholder, className }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const aiSearch = useAISearch();
  const { data: suggestions } = useSearchSuggestions();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    try {
      const result = await aiSearch.mutateAsync({ query });
      onResults?.(result);
      setShowSuggestions(false);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    // Auto-search when suggestion is clicked
    setTimeout(() => handleSearch(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative" ref={inputRef}>
            <Input
              type="text"
              placeholder={placeholder || t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowSuggestions(true)}
              className="pr-10 bg-background dark:bg-gray-800 border-input dark:border-gray-600 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-gray-400"
              data-testid="search-input"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleSearch}
              disabled={aiSearch.isPending || !query.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
              data-testid="search-button"
            >
              {aiSearch.isPending ? (
                <Bot className="h-4 w-4 animate-pulse" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* AI Search Suggestions */}
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-0 border border-border bg-card dark:bg-gray-800">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-3 hover:bg-muted dark:hover:bg-gray-700 cursor-pointer border-b border-border dark:border-gray-600 last:border-b-0 flex items-center text-foreground dark:text-white"
                data-testid={`search-suggestion-${index}`}
              >
                <Lightbulb className="text-yellow-500 mr-2 h-4 w-4" />
                <span className="text-sm">{suggestion}</span>
              </div>
            ))}
          </Card>
        )}

    </div>
  );
}