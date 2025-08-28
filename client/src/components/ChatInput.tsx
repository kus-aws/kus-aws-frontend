import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel: () => void;
  loading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onCancel, loading, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || disabled) return;
    
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t bg-white p-4">
      <div className="flex space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="궁금한 것을 질문해보세요..."
          disabled={disabled}
          className="flex-1"
          aria-label="메시지 입력"
        />
        {loading ? (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="전송 중단"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!input.trim() || disabled}
            size="icon"
            className="shrink-0"
            aria-label="메시지 전송"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        <span>Enter를 눌러 전송 • Shift+Enter로 줄바꿈</span>
        {loading && (
          <span className="ml-4 text-orange-600">
            전송 중... (중단하려면 ⏹️ 클릭)
          </span>
        )}
      </div>
    </form>
  );
}