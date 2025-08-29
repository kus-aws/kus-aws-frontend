import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { streamChat, fetchSuggestions } from '@/lib/api';
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
  const controllerRef = useRef<AbortController | null>(null);
  const streamCleanupRef = useRef<(() => void) | null>(null);
  
  // 성능 모니터링 훅 사용
  const { startStreaming, recordChunk, endStreaming } = usePerformance();

  // 메시지 업데이트 최적화를 위한 함수
  const updateMessage = useCallback((index: number, text: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages[index]) {
        newMessages[index] = { ...newMessages[index], text };
      }
      return newMessages;
    });
  }, []);

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

    // 이전 스트리밍 정리
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }

    const ac = new AbortController(); 
    controllerRef.current = ac;

    try {
      const cleanup = streamChat({
        q, 
        major: init.major, 
        subField: init.subField, 
        conversationId,
        onStart: (cid) => {
          if (cid && cid !== conversationId) {
            setCid(cid);
            localStorage.setItem('cid', cid);
          }
        },
        onDelta: (chunk) => {
          // 성능 메트릭 기록
          recordChunk(chunk);
          updateMessage(assistantIndex, (messages[assistantIndex]?.text || '') + chunk);
        },
        onDone: async () => {
          setLoading(false);
          // 성능 모니터링 종료
          endStreaming();
          
          try {
            const sugs = await fetchSuggestions({
              conversationId, 
              major: init.major, 
              subField: init.subField, 
              suggestCount: init.suggestCount ?? 3,
            });
            setSuggestions(sugs);
          } catch (err) {
            console.warn('추천 질문 로딩 실패:', err);
            // 추천 질문 실패는 치명적이지 않음
          }
        },
        onError: (msg) => { 
          setLoading(false);
          setError(msg || '스트리밍 중 오류가 발생했습니다.');
          // 에러 발생 시 빈 어시스턴트 메시지 제거
          setMessages(prev => prev.filter((_, i) => i !== assistantIndex));
          // 성능 모니터링 종료
          endStreaming();
        },
      });
      
      streamCleanupRef.current = cleanup;
    } catch (err) {
      setLoading(false);
      setError('스트리밍을 시작할 수 없습니다.');
      // 에러 발생 시 빈 어시스턴트 메시지 제거
      setMessages(prev => prev.filter((_, i) => i !== assistantIndex));
      // 성능 모니터링 종료
      endStreaming();
    }
  }

  const cancel = useCallback(() => { 
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
    setLoading(false);
    // 성능 모니터링 종료
    endStreaming();
  }, [endStreaming]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
      }
      // 성능 모니터링 종료
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