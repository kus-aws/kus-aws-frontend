import { useRef, useState } from 'react';
import { streamChat, fetchSuggestions } from '@/lib/api';

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

  async function send(q: string) {
    setError(undefined);
    setSuggestions([]);
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'assistant', text: '' }]);
    setLoading(true);

    const ac = new AbortController(); controllerRef.current = ac;
    const assistantIndex = messages.length + 1;

    streamChat({
      q, major: init.major, subField: init.subField, conversationId,
      onStart: (cid) => { if (cid !== conversationId) { setCid(cid); localStorage.setItem('cid', cid); } },
      onDelta: (chunk) => {
        setMessages((m) => {
          const copy = [...m];
          copy[assistantIndex] = { role: 'assistant', text: (copy[assistantIndex]?.text || '') + chunk };
          return copy;
        });
      },
      onDone: async () => {
        setLoading(false);
        try {
          const sugs = await fetchSuggestions({
            conversationId, major: init.major, subField: init.subField, suggestCount: init.suggestCount ?? 3,
          });
          setSuggestions(sugs);
        } catch { /* ignore */ }
      },
      onError: (msg) => { setLoading(false); setError(msg || 'error'); },
      signal: ac.signal,
    });
  }

  function cancel() { controllerRef.current?.abort(); setLoading(false); }
  return { messages, loading, error, suggestions, conversationId, send, cancel };
}