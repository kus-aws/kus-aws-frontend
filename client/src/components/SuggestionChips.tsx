import React from 'react';
import { Button } from '@/components/ui/button';

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export function SuggestionChips({ suggestions, onSelect, disabled = false }: SuggestionChipsProps) {
  if (!suggestions.length) return null;

  return (
    <div className="bg-gray-50 border-t p-4">
      <div className="text-sm text-gray-600 mb-3">💡 연관 질문</div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className="text-sm bg-white hover:bg-blue-50 border-blue-200 text-blue-700 max-w-xs"
            title={suggestion}
          >
            <span className="truncate">{suggestion}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}