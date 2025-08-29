import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageFeedbackProps {
  messageId: string;
  onFeedback?: (type: 'positive' | 'negative', messageId: string) => void;
  onComment?: (comment: string, messageId: string) => void;
  className?: string;
}

export function MessageFeedback({ 
  messageId, 
  onFeedback, 
  onComment, 
  className = '' 
}: MessageFeedbackProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    onFeedback?.(type, messageId);
    
    // 긍정적 피드백 시 자동으로 숨김
    if (type === 'positive') {
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      onComment?.(comment.trim(), messageId);
      setComment('');
      setShowComment(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit();
    }
  };

  return (
    <div className={`flex items-center space-x-2 mt-2 ${className}`}>
      {/* 피드백 버튼들 */}
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback('positive')}
          className={`h-8 px-2 ${
            feedback === 'positive' 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'hover:bg-gray-100'
          }`}
          aria-label="긍정적 피드백"
          aria-pressed={feedback === 'positive'}
        >
          <ThumbsUp className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback('negative')}
          className={`h-8 px-2 ${
            feedback === 'negative' 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'hover:bg-gray-100'
          }`}
          aria-label="부정적 피드백"
          aria-pressed={feedback === 'negative'}
        >
          <ThumbsDown className="w-4 h-4" />
        </Button>
      </div>

      {/* 코멘트 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComment(!showComment)}
        className="h-8 px-2 hover:bg-gray-100"
        aria-label="코멘트 추가"
        aria-expanded={showComment}
      >
        <MessageSquare className="w-4 h-4" />
      </Button>

      {/* 피드백 상태 표시 */}
      {feedback && (
        <span className="text-sm text-gray-600 ml-2">
          {feedback === 'positive' ? '👍 도움이 되었습니다' : '👎 개선이 필요합니다'}
        </span>
      )}

      {/* 코멘트 입력 */}
      {showComment && (
        <div className="flex-1 ml-2">
          <div className="flex space-x-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="의견을 입력해주세요..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              maxLength={500}
            />
            <div className="flex flex-col space-y-1">
              <Button
                size="sm"
                onClick={handleCommentSubmit}
                disabled={!comment.trim()}
                className="h-8 px-3"
              >
                전송
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowComment(false);
                  setComment('');
                }}
                className="h-6 px-2 text-xs"
              >
                취소
              </Button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {comment.length}/500자
          </div>
        </div>
      )}
    </div>
  );
}