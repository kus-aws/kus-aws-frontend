import React from 'react';
import { Button } from '@/components/ui/button';

interface FollowupChipsProps {
  suggestions?: string[];
  onPick: (question: string) => void;
  disabled?: boolean;
}

export function FollowupChips({ suggestions, onPick, disabled = false }: FollowupChipsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  // 최대 3개까지만 표시
  const displaySuggestions = suggestions.slice(0, 3);

  return (
    <div className="mt-3 flex flex-wrap gap-2" data-testid="followup-chips">
      {displaySuggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onPick(suggestion)}
          disabled={disabled}
          aria-label={`연계 질문: ${suggestion}`}
          title={suggestion}
          className="px-3 py-1 rounded-full text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed max-w-xs truncate"
          data-testid={`followup-chip-${index}`}
        >
          <span className="truncate">{suggestion}</span>
        </Button>
      ))}
    </div>
  );
}