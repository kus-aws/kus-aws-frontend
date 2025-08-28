// Clean SSE streaming API for AWS Lambda backend
const BASE = (import.meta.env.NEXT_PUBLIC_BACKEND_BASE || 'https://2kdtuncj36tas5twwm7dsgpz5y0bkfkw.lambda-url.us-east-1.on.aws').replace(/\/+$/, '');

console.log('🔧 Backend URL:', BASE);
if (!import.meta.env.NEXT_PUBLIC_BACKEND_BASE) {
  console.warn('⚠️ NEXT_PUBLIC_BACKEND_BASE not set, using fallback URL');
  console.log('Available env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('NEXT_PUBLIC')));
}

export type SSEEvent =
  | { type: 'start'; conversationId: string }
  | { type: 'answer_delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export async function health(): Promise<'ok'> {
  console.log('🔍 Health check URL:', `${BASE}/health`);
  const r = await fetch(`${BASE}/health`, { credentials: 'omit' });
  return r.json();
}

export function streamChat(opts: {
  q: string; 
  major: string; 
  subField: string; 
  conversationId: string;
  onStart?: (cid: string) => void;
  onDelta: (chunk: string) => void;
  onDone?: () => void;
  onError?: (msg: string) => void;
  signal?: AbortSignal;
}) {
  const { q, major, subField, conversationId, onStart, onDelta, onDone, onError, signal } = opts;
  
  const u = new URL(`${BASE}/chat/stream`);
  u.searchParams.set('q', q);
  u.searchParams.set('major', major);
  u.searchParams.set('subField', subField);
  u.searchParams.set('conversationId', conversationId);

  console.log('🌊 Starting SSE stream:', u.toString());
  const es = new EventSource(u.toString(), { withCredentials: false });
  const close = () => es.close();
  if (signal) signal.addEventListener('abort', close, { once: true });

  es.onmessage = (e) => {
    try {
      console.log('📨 SSE message received:', e.data);
      const data = JSON.parse(e.data) as SSEEvent;
      if (data.type === 'start') {
        console.log('🚀 SSE stream started:', data.conversationId);
        onStart?.(data.conversationId);
      }
      else if (data.type === 'answer_delta') onDelta(data.text);
      else if (data.type === 'done') { 
        console.log('✅ SSE stream completed');
        onDone?.(); 
        es.close(); 
      }
      else if (data.type === 'error') { 
        console.error('❌ SSE stream error:', data.message);
        onError?.(data.message); 
        es.close(); 
      }
    } catch (err) {
      console.error('🔥 SSE parse error:', err, 'Raw data:', e.data);
      onError?.('parse error'); 
      es.close();
    }
  };
  es.onerror = (event) => { 
    console.error('🔥 SSE Error:', event);
    console.log('🔍 EventSource readyState:', es.readyState);
    onError?.('connection error'); 
    es.close(); 
  };

  return close; // caller may call to abort
}

export async function fetchSuggestions(body: {
  conversationId: string; 
  major: string; 
  subField: string; 
  suggestCount: number;
}): Promise<string[]> {
  const r = await fetch(`${BASE}/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'omit',
  });
  const j = await r.json();
  return Array.isArray(j?.suggestions) ? j.suggestions : [];
}