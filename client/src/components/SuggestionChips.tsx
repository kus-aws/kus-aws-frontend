import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface SuggestionChipsProps {
  items: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SuggestionChips({ 
  items, 
  onSelect, 
  disabled = false,
  className = '' 
}: SuggestionChipsProps) {
  if (!items?.length) return null;

  return (
    <div className={`mt-3 ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <Lightbulb className="w-3 h-3 text-amber-500" />
        <span className="text-xs text-gray-500 font-medium">연계 질문</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((suggestion, index) => (
          <Button
            key={`${suggestion}-${index}`}
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className="text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-700 max-w-full disabled:opacity-50 disabled:cursor-not-allowed h-6 px-2 py-1"
            title={disabled ? "응답 생성 중..." : "이 질문으로 이어서 묻기"}
          >
            <span className="truncate text-xs">{suggestion}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}