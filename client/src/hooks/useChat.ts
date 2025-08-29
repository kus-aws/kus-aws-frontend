import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { chat, fetchSuggestions, ChatResp } from '@/lib/api';
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
  
  // 중복 전송 방지
  const sendingRef = useRef(false);
  
  // 레이스 컨디션 방지를 위한 턴 ID
  const lastTurnRef = useRef<string>('');
  
  // 성능 모니터링 훅 사용
  const { endStreaming } = usePerformance();

  async function send(q: string) {
    if (!q.trim()) return;
    
    // 중복 전송 방지
    if (sendingRef.current) {
      console.warn('[useChat] Duplicate send attempt blocked');
      return;
    }
    
    sendingRef.current = true;
    setLoading(true);
    setSuggestions([]);
    
    // 사용자 메시지 추가
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    
    // 어시스턴트 메시지 초기화 및 인덱스 계산
    let assistantIndex: number;
    setMessages(prev => {
      assistantIndex = prev.length;
      return [...prev, { role: 'assistant', text: '' }];
    });
    
    // 턴 ID 생성 (레이스 컨디션 방지)
    const turnId = crypto?.randomUUID?.() ?? String(Date.now());
    lastTurnRef.current = turnId;

    try {
      // Lambda 직접 호출 모드에서는 일반 채팅 사용
      const response: ChatResp = await chat({
        userQuestion: q,
        major: init.major,
        subField: init.subField,
        conversationId, // 연속 대화 유지
        followupMode: init.suggestCount ? 'multi' : 'single',
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

      // conversationId 업데이트 (연속 대화 유지)
      if (response.conversationId && response.conversationId !== conversationId) {
        setCid(response.conversationId);
        localStorage.setItem('cid', response.conversationId);
      }

      // 1차: /chat 내장 suggestions 확인
      const primarySuggestions = response.suggestions || [];
      if (primarySuggestions.length > 0) {
        if (lastTurnRef.current === turnId) {
          setSuggestions(primarySuggestions);
        }
        return;
      }

      // 2차: 서버 /suggestions API 폴백 (비동기, UI 블로킹 X)
      if (response.conversationId && lastTurnRef.current === turnId) {
        try {
          const fallbackSuggestions = await fetchSuggestions({
            conversationId: response.conversationId,
            major: init.major,
            subField: init.subField,
            suggestCount: init.suggestCount ?? 3,
          });
          
          // 턴 ID가 여전히 유효한지 확인
          if (lastTurnRef.current === turnId) {
            setSuggestions(fallbackSuggestions);
          }
        } catch (error) {
          console.warn('[useChat] fetchSuggestions fallback failed:', error);
          // 폴백 실패는 조용히 처리 (사용자 경험에 영향 없음)
        }
      }

      setLoading(false);
      endStreaming();

    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '채팅 중 오류가 발생했습니다.');
      // 에러 발생 시 빈 어시스턴트 메시지 제거
      setMessages(prev => prev.filter((_, i) => i !== assistantIndex));
      endStreaming();
    } finally {
      sendingRef.current = false;
    }
  }

  const cancel = useCallback(() => { 
    setLoading(false);
    endStreaming();
    sendingRef.current = false;
  }, [endStreaming]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      endStreaming();
      sendingRef.current = false;
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