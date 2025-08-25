import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface MessageFeedbackProps {
  messageId: string;
  onFeedbackSubmitted?: (feedback: 'like' | 'dislike') => void;
}

export function MessageFeedback({ messageId, onFeedbackSubmitted }: MessageFeedbackProps) {
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (feedback || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiService.sendFeedback({
        messageId,
        feedback: type,
      });

      setFeedback(type);
      onFeedbackSubmitted?.(type);

      toast({
        title: "피드백 감사합니다!",
        description: type === 'like' ? '도움이 되었다니 기쁩니다.' : '더 나은 답변을 위해 노력하겠습니다.',
      });
    } catch (error) {
      toast({
        title: "피드백 전송 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('like')}
        disabled={feedback !== null || isSubmitting}
        className={`h-6 px-2 ${
          feedback === 'like' 
            ? 'text-green-600 bg-green-50' 
            : 'text-gray-400 hover:text-green-600'
        }`}
        data-testid={`feedback-like-${messageId}`}
      >
        <ThumbsUp className="w-3 h-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('dislike')}
        disabled={feedback !== null || isSubmitting}
        className={`h-6 px-2 ${
          feedback === 'dislike' 
            ? 'text-red-600 bg-red-50' 
            : 'text-gray-400 hover:text-red-600'
        }`}
        data-testid={`feedback-dislike-${messageId}`}
      >
        <ThumbsDown className="w-3 h-3" />
      </Button>
    </div>
  );
}