import { useState, useRef, useEffect } from 'react';
import { streamChat, fetchSuggestions } from '@/lib/api';
import type { ChatMessage } from '@/lib/types';

interface UseChatParams {
  major: string;
  subField: string;
  suggestCount?: number;
  conversationId?: string;
}

export function useChat(params: UseChatParams) {
  const { major, subField, suggestCount = 3 } = params;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState(() => {
    if (params.conversationId) return params.conversationId;
    
    const stored = localStorage.getItem('chatConversationId');
    if (stored) return stored;
    
    const newId = crypto.randomUUID();
    localStorage.setItem('chatConversationId', newId);
    return newId;
  });
  
  const controllerRef = useRef<AbortController | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Update localStorage when conversationId changes
  useEffect(() => {
    localStorage.setItem('chatConversationId', conversationId);
  }, [conversationId]);

  const send = async (question: string): Promise<() => void> => {
    // Clear previous state
    setError(undefined);
    setSuggestions([]);
    setLoading(true);

    // Add user message and prepare assistant message
    setMessages(prev => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: '' }
    ]);

    // Setup abort controller
    const abortController = new AbortController();
    controllerRef.current = abortController;

    const assistantMessageIndex = messages.length + 1;

    try {
      const cleanup = streamChat({
        q: question,
        major,
        subField,
        conversationId,
        signal: abortController.signal,
        
        onStart: (cid) => {
          if (cid !== conversationId) {
            setConversationId(cid);
          }
        },
        
        onDelta: (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            if (updated[assistantMessageIndex]) {
              updated[assistantMessageIndex] = {
                ...updated[assistantMessageIndex],
                text: updated[assistantMessageIndex].text + chunk
              };
            }
            return updated;
          });
        },
        
        onDone: async () => {
          setLoading(false);
          
          // Fetch suggestions after streaming completes
          try {
            const newSuggestions = await fetchSuggestions({
              conversationId,
              major,
              subField,
              suggestCount
            });
            setSuggestions(newSuggestions);
          } catch (err) {
            console.warn('Failed to load suggestions:', err);
            // Don't set error state for suggestions failure
          }
        },
        
        onError: (message) => {
          setLoading(false);
          setError(message || 'Connection error');
        }
      });

      cleanupRef.current = cleanup;
      
      return () => {
        cleanup();
        setLoading(false);
      };
    } catch (err) {
      setLoading(false);
      setError('Failed to start streaming');
      return () => {};
    }
  };

  const cancel = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    
    setLoading(false);
  };

  const reset = () => {
    cancel();
    setMessages([]);
    setError(undefined);
    setSuggestions([]);
    
    // Generate new conversation ID
    const newId = crypto.randomUUID();
    setConversationId(newId);
  };

  return {
    messages,
    loading,
    error,
    suggestions,
    conversationId,
    send,
    cancel,
    reset
  };
}