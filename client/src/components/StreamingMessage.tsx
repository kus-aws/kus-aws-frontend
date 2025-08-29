import { useEffect, useState } from 'react';
import { ImprovedTypingIndicator } from './ImprovedTypingIndicator';

interface StreamingMessageProps {
  text: string;
  isStreaming: boolean;
  onComplete?: () => void;
}

export function StreamingMessage({ text, isStreaming, onComplete }: StreamingMessageProps) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isStreaming && text) {
      setIsTyping(true);
      setDisplayText(text);
    } else if (!isStreaming && text) {
      setIsTyping(false);
      setDisplayText(text);
      onComplete?.();
    }
  }, [text, isStreaming, onComplete]);

  // 타이핑 애니메이션 효과
  useEffect(() => {
    if (!isTyping || !text) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        onComplete?.();
      }
    }, 30); // 타이핑 속도 조절

    return () => clearInterval(interval);
  }, [text, isTyping, onComplete]);

  if (!text && !isStreaming) return null;

  return (
    <div className="space-y-2">
      <div className="prose prose-sm max-w-none">
        {displayText ? (
          <div className="whitespace-pre-wrap break-words">
            {displayText}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
            )}
          </div>
        ) : (
          <ImprovedTypingIndicator />
        )}
      </div>
      
      {isStreaming && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
          <span>답변 생성 중...</span>
        </div>
      )}
    </div>
  );
}