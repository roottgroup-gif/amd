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
            <Bot className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5" />
          </div>
        </div>
        
        {/* AI Search Suggestions */}
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-0 border border-border">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0 flex items-center"
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
