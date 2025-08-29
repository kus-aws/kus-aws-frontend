import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { chat, fetchSuggestions, ChatResp } from '@/lib/api';
import { usePerformance } from './usePerformance';

type Msg = { 
  role: 'user' | 'assistant'; 
  text: string; 
  suggestions?: string[];
  messageId: string;
};

export function useChat(init: { major: string; subField: string; suggestCount?: number; conversationId?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [conversationId, setCid] = useState(() => {
    if (typeof window === 'undefined') return init.conversationId ?? 'cid-server';
    const saved = localStorage.getItem('cid');
    const cid = init.conversationId ?? saved ?? crypto.randomUUID();
    if (!saved) localStorage.setItem('cid', cid);
    return cid;
  });
  
  // 중복 전송 방지
  const sendingRef = useRef(false);
  
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
    
    // 사용자 메시지 추가
    const userMessageId = crypto.randomUUID();
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: q, 
      messageId: userMessageId 
    }]);
    
    // 어시스턴트 메시지 초기화 및 인덱스 계산
    let assistantIndex: number;
    const assistantMessageId = crypto.randomUUID();
    setMessages(prev => {
      assistantIndex = prev.length;
      return [...prev, { 
        role: 'assistant', 
        text: '', 
        suggestions: [],
        messageId: assistantMessageId 
      }];
    });

    try {
      // 1단계: 빠른 응답을 위한 /chat 호출
      const response: ChatResp = await chat({
        userQuestion: q,
        major: init.major,
        subField: init.subField,
        conversationId, // 연속 대화 유지
        followupMode: "never", // 빠른 응답
        suggestCount: 0,       // suggestions 없음
      });

      // 응답 처리
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[assistantIndex]) {
          newMessages[assistantIndex] = { 
            ...newMessages[assistantIndex],
            text: response.aiResponse 
          };
        }
        return newMessages;
      });

      // conversationId 업데이트 (연속 대화 유지)
      if (response.conversationId && response.conversationId !== conversationId) {
        setCid(response.conversationId);
        localStorage.setItem('cid', response.conversationId);
      }

      // 2단계: 비동기로 /suggestions 호출 (UI 블로킹 없음)
      if (response.conversationId) {
        // suggestions를 별도로 가져오기
        fetchSuggestions({
          conversationId: response.conversationId,
          major: init.major,
          subField: init.subField,
          suggestCount: init.suggestCount ?? 3,
        }).then(fallbackSuggestions => {
          if (fallbackSuggestions.length > 0) {
            // 해당 메시지에 suggestions 추가
            setMessages(prev => prev.map(msg => 
              msg.messageId === assistantMessageId 
                ? { ...msg, suggestions: fallbackSuggestions }
                : msg
            ));
          }
        }).catch(error => {
          console.warn('[useChat] fetchSuggestions failed:', error);
          // suggestions 실패는 조용히 처리 (사용자 경험에 영향 없음)
        });
      }

      setLoading(false);
      endStreaming();

    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : '채팅 중 오류가 발생했습니다.');
      // 에러 발생 시 빈 어시스턴트 메시지 제거
      setMessages(prev => prev.filter(msg => msg.messageId !== assistantMessageId));
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
    conversationId, 
    send, 
    cancel
  }), [messages, loading, error, conversationId, send, cancel]);

  return result;
}