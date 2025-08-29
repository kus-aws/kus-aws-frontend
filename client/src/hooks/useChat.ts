import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { chat } from '@/lib/api';
import { usePerformance } from './usePerformance';

type Msg = { role: 'user' | 'assistant'; text: string };

export function useChat(init: { major: string; subField: string; suggestCount?: number; conversationId?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationId, setCid] = useState(() => {
    if (typeof window === 'undefined') return init.conversationId ?? 'cid-server';
    const saved = localStorage.getItem('cid');
    const cid = init.conversationId ?? saved ?? crypto.randomUUID();
    if (!saved) localStorage.setItem('cid', cid);
    return cid;
  });
  
  // 성능 모니터링 훅 사용
  const { startStreaming, endStreaming } = usePerformance();

  async function send(q: string) {
    if (!q.trim()) return;
    
    setError(undefined);
    setSuggestions([]);
    
    // 사용자 메시지 추가
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    
    // 어시스턴트 메시지 초기화 및 인덱스 계산
    let assistantIndex: number;
    setMessages(prev => {
      assistantIndex = prev.length;
      return [...prev, { role: 'assistant', text: '' }];
    });
    
    setLoading(true);

    // 성능 모니터링 시작
    startStreaming();

    try {
      // Lambda 직접 호출 모드에서는 일반 채팅 사용
      const response = await chat({
        userQuestion: q,
        major: init.major,
        subField: init.subField,
        conversationId,
        followupMode: init.suggestCount ? 'multi' : 'never',
        suggestCount: init.suggestCount ?? 3,
      });

      // 응답 처리
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[assistantIndex]) {
          newMessages[assistantIndex] = { role: 'assistant', text: response.aiResponse };
        }
        return newMessages;
      });

      // conversationId 업데이트
      if (response.conversationId && response.conversationId !== conversationId) {
        setCid(response.conversationId);
        localStorage.setItem('cid', response.conversationId);
      }

      // 추천 질문 설정
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }

      setLoading(false);
      endStreaming();

    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '채팅 중 오류가 발생했습니다.');
      // 에러 발생 시 빈 어시스턴트 메시지 제거
      setMessages(prev => prev.filter((_, i) => i !== assistantIndex));
      endStreaming();
    }
  }

  const cancel = useCallback(() => { 
    setLoading(false);
    endStreaming();
  }, [endStreaming]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      endStreaming();
    };
  }, [endStreaming]);

  // 메모이제이션된 반환값
  const result = useMemo(() => ({
    messages, 
    loading, 
    error, 
    suggestions, 
    conversationId, 
    send, 
    cancel
  }), [messages, loading, error, suggestions, conversationId, send, cancel]);

  return result;
}