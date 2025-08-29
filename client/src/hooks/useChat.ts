import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { chat, fetchSuggestions, ChatResp, ApiError } from '@/lib/api';
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
    setError(undefined); // 에러 초기화
    
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
      // 1단계: 메인 답변만 받기 (followupMode: "never", suggestCount: 0)
      const response: ChatResp = await chat({
        userQuestion: q,
        major: init.major,
        subField: init.subField,
        conversationId, // 연속 대화 유지
        followupMode: "never", // ★ 중요: suggestions 제외
        suggestCount: 0,       // ★ 중요: suggestions 개수 0
      });

      // 메인 답변 렌더링
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[assistantIndex]) {
          newMessages[assistantIndex] = {
            ...newMessages[assistantIndex],
            text: response.aiResponse,
            suggestions: [] // 초기에는 빈 배열
          };
        }
        return newMessages;
      });

      // conversationId 업데이트 (연속 대화 유지)
      if (response.conversationId && response.conversationId !== conversationId) {
        setCid(response.conversationId);
        localStorage.setItem('cid', response.conversationId);
      }

      // 2단계: 제안 질문 별도 호출 (비차단)
      if (init.suggestCount && init.suggestCount > 0) {
        console.log('[useChat] Fetching suggestions separately...');
        
        // 비차단으로 suggestions 호출
        fetchSuggestions({
          conversationId: response.conversationId,
          major: init.major,
          subField: init.subField,
          suggestCount: init.suggestCount
        }).then(suggestions => {
          console.log('[useChat] Suggestions received:', suggestions);
          
          // suggestions 업데이트
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[assistantIndex]) {
              newMessages[assistantIndex] = {
                ...newMessages[assistantIndex],
                suggestions: suggestions
              };
            }
            return newMessages;
          });
        }).catch(error => {
          console.warn('[useChat] Failed to fetch suggestions:', error);
          // suggestions 실패는 치명적이지 않음
        });
      }

    } catch (error) {
      console.error('[useChat] Chat request failed:', error);
      
      let errorMessage = '일시적인 오류가 발생했습니다.';
      let isTimeoutError = false;
      
      if (error instanceof ApiError) {
        if (error.status === 504) {
          errorMessage = '지금 답변 생성이 지연되고 있어요. 잠시 후 다시 시도해 주세요.';
          isTimeoutError = true;
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // 에러 메시지 표시
      setError(errorMessage);
      
      // 어시스턴트 메시지에 에러 표시
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[assistantIndex]) {
          newMessages[assistantIndex] = {
            ...newMessages[assistantIndex],
            text: errorMessage,
            suggestions: []
          };
        }
        return newMessages;
      });
      
      // 타임아웃 에러인 경우 자동 재시도 (최대 1회)
      if (isTimeoutError) {
        console.log('[useChat] Timeout error detected, will retry automatically');
        // 여기서는 UI에 재시도 옵션만 제공하고, 실제 재시도는 사용자가 선택하도록 함
      }
      
    } finally {
      setLoading(false);
      sendingRef.current = false;
      endStreaming();
    }
  }

  // 타임아웃 에러 재시도 함수
  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();
    
    if (lastUserMessage && !loading) {
      console.log('[useChat] Retrying last message due to timeout');
      await send(lastUserMessage.text);
    }
  }, [messages, loading]);

  // 오프라인 저장 함수 (선택사항)
  const saveOffline = useCallback(() => {
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();
    
    if (lastUserMessage) {
      // 로컬 스토리지에 저장
      const offlineData = {
        question: lastUserMessage.text,
        timestamp: new Date().toISOString(),
        major: init.major,
        subField: init.subField
      };
      
      const existing = JSON.parse(localStorage.getItem('offline_questions') || '[]');
      existing.push(offlineData);
      localStorage.setItem('offline_questions', JSON.stringify(existing));
      
      console.log('[useChat] Question saved offline:', offlineData);
    }
  }, [messages, init.major, init.subField]);

  // 제안만 보기 함수
  const showSuggestionsOnly = useCallback(async () => {
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();
    
    if (lastUserMessage && !loading) {
      console.log('[useChat] Fetching suggestions only');
      
      try {
        const suggestions = await fetchSuggestions({
          conversationId,
          major: init.major,
          subField: init.subField,
          suggestCount: init.suggestCount || 3
        });
        
        // suggestions만 업데이트
        setMessages(prev => {
          const newMessages = [...prev];
          const lastAssistantIndex = newMessages.findIndex(m => m.role === 'assistant');
          if (lastAssistantIndex !== -1) {
            newMessages[lastAssistantIndex] = {
              ...newMessages[lastAssistantIndex],
              suggestions: suggestions
            };
          }
          return newMessages;
        });
        
        setError(undefined);
      } catch (error) {
        console.error('[useChat] Failed to fetch suggestions only:', error);
        setError('제안 질문을 가져올 수 없습니다.');
      }
    }
  }, [messages, loading, conversationId, init.major, init.subField, init.suggestCount]);

  // 대화 초기화
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(undefined);
    setLoading(false);
    sendingRef.current = false;
    
    // 새로운 conversationId 생성
    const newCid = crypto.randomUUID();
    setCid(newCid);
    localStorage.setItem('cid', newCid);
  }, []);

  return {
    messages,
    loading,
    error,
    send,
    retryLastMessage,
    saveOffline,
    showSuggestionsOnly,
    clearChat,
    conversationId
  };
}