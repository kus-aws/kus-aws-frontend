import { Button } from '@/components/ui/button';
import { MessageSquareMore } from 'lucide-react';

interface MessageSuggestionChipsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  disabled?: boolean;
}

export function MessageSuggestionChips({ 
  suggestions, 
  onSuggestionClick, 
  disabled = false 
}: MessageSuggestionChipsProps) {
  if (!suggestions?.length) return null;

  return (
    <div className="mt-4 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquareMore className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-xs font-medium text-gray-600">이어서 물어보기</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, 5).map((suggestion, index) => (
          <Button
            key={`msg-suggestion-${index}`}
            variant="ghost"
            size="sm"
            onClick={() => onSuggestionClick(suggestion)}
            disabled={disabled}
            className="
              h-auto min-h-[32px] px-3 py-2 text-xs
              bg-blue-50 hover:bg-blue-100 
              text-blue-700 hover:text-blue-800
              border border-blue-200 hover:border-blue-300
              rounded-full transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              max-w-[280px] text-left justify-start
              shadow-sm hover:shadow-md
            "
            title={suggestion.length > 35 ? suggestion : undefined}
          >
            <span className="truncate leading-relaxed">
              {suggestion.length > 35 ? `${suggestion.slice(0, 35)}...` : suggestion}
            </span>
          </Button>
        ))}
      </div>
      
      {suggestions.length > 5 && (
        <p className="text-xs text-gray-400 mt-2">
          +{suggestions.length - 5}개 더 있음
        </p>
      )}
    </div>
  );
}