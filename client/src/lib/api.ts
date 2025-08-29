// src/lib/api.ts

// Lambda Direct Call Configuration (Temporary Hotfix)
const LAMBDA_URL = 'https://2kdtuncj36tas5twwm7dsgpz5y0bkfkw.lambda-url.us-east-1.on.aws';
const USE_LAMBDA_DIRECT = true; // Toggle flag for easy rollback

export const BASE = (
  import.meta.env.VITE_BACKEND_BASE || 
  import.meta.env.NEXT_PUBLIC_BACKEND_BASE || ''
).replace('/$/', '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Enhanced types for better type safety
export type ChatBody = {
  userQuestion: string;
  major: string;
  subField: string;
  conversationId?: string;
  followupMode?: "never" | "single" | "multi";
  suggestCount?: number;
};

export type ChatResp = {
  aiResponse: string;
  conversationId: string;
  suggestions?: string[] | null;
};

function mustBase() {
  if (!BASE) throw new Error('백엔드 주소 미설정: .env(또는 Vercel env)의 VITE_BACKEND_BASE를 확인하세요.');
}

// Utility function to generate trace ID
function makeTraceId() {
  try { 
    return crypto.randomUUID(); 
  } catch { 
    return `trace-${Date.now()}`; 
  }
}

// Enhanced fetch with timeout and error handling
async function fetchJSON(url: string, init: RequestInit, timeoutMs = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(url, { 
      ...init, 
      signal: controller.signal,
      headers: {
        ...init.headers,
        'x-trace-id': makeTraceId(),
      }
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${text || "Internal Server Error"}`);
    }
    
    return res.json();
  } finally {
    clearTimeout(id);
  }
}

// Safe JSON parsing with fallback
function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn('[api] JSON parse failed, using fallback:', error);
    return null;
  }
}

// Normalize suggestions array
function normalizeSuggestions(suggestions: unknown): string[] {
  if (!Array.isArray(suggestions)) return [];
  return suggestions
    .filter(item => typeof item === 'string' && item.trim())
    .slice(0, 5); // 최대 5개로 제한
}

export async function health() {
  if (USE_LAMBDA_DIRECT) {
    // Direct Lambda call
    const r = await fetch(`${LAMBDA_URL}/health`, { 
      credentials: 'omit',
      headers: {
        'x-trace-id': makeTraceId(),
      }
    });
    try { 
      return await r.json(); 
    } catch { 
      return 'ok'; 
    }
  } else {
    // Original backend call
    mustBase();
    const r = await fetch(`${BASE}/health`, { credentials: 'omit' });
    try { 
      return await r.json(); 
    } catch { 
      return 'ok'; 
    }
  }
}

function isChatResp(x: any): x is ChatResp {
  return x && typeof x.aiResponse === 'string' && typeof x.conversationId === 'string';
}

export async function chat(body: ChatBody): Promise<ChatResp> {
  // Input validation
  if (!body.userQuestion?.trim()) {
    throw new ApiError('질문을 입력해주세요.');
  }
  if (body.userQuestion.length > 1000) {
    throw new ApiError('질문은 1000자 이내로 입력해주세요.');
  }
  if (!body.major?.trim() || !body.subField?.trim()) {
    throw new ApiError('전공과 세부 분야를 선택해주세요.');
  }

  if (USE_LAMBDA_DIRECT) {
    // Direct Lambda call - /chat endpoint
    try {
      console.log('[chat] Lambda direct call to:', `${LAMBDA_URL}/chat`);
      console.log('[chat] Request payload:', body);
      
      const r = await fetch(`${LAMBDA_URL}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-trace-id': makeTraceId(),
        },
        body: JSON.stringify(body),
        credentials: 'omit',
      });

      // Get response as text first (preserve error messages)
      const text = await r.text();
      console.log('[chat] Lambda raw response:', text);
      
      if (!r.ok) {
        throw new Error(`HTTP ${r.status} ${text || "Internal Server Error"}`);
      }

      // Safe JSON parsing
      const response = safeJsonParse(text);
      if (!response) {
        throw new ApiError('Lambda 응답을 파싱할 수 없습니다.');
      }
      
      console.log('[chat] Lambda parsed response:', response);
      
      if (!isChatResp(response)) {
        console.warn('[chat] invalid response shape:', response);
        return { 
          aiResponse: '죄송합니다. 일시적인 오류가 발생했습니다.', 
          conversationId: body.conversationId ?? 'unknown', 
          suggestions: [] 
        };
      }
      
      // Normalize suggestions
      response.suggestions = normalizeSuggestions(response.suggestions);
      return response;
      
    } catch (error) {
      console.error('[chat] Lambda direct call failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('요청 시간이 초과되었습니다. 다시 시도해주세요.');
      }
      throw new ApiError('Lambda 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  } else {
    // Original backend call - /api/chat endpoint
    mustBase();
    const r = await fetch(`${BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
    });
    
    if (!r.ok) {
      console.error(`[chat] HTTP ${r.status} ${r.statusText}`);
      const errorText = await r.text().catch(() => 'No error text');
      console.error('[chat] Error response:', errorText);
      
      // Enhanced error messages
      let errorMessage = '서버 오류가 발생했습니다.';
      if (r.status === 429) {
        errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      } else if (r.status === 502) {
        errorMessage = '백엔드 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.';
        console.error('[chat] 502 Bad Gateway - 백엔드 서버 문제 발생');
        console.error('[chat] 백엔드 개발자에게 다음 정보를 전달하세요:');
        console.error('[chat] - 오류: 502 Bad Gateway');
        console.error('[chat] - 엔드포인트: /chat');
        console.error('[chat] - 응답:', errorText);
        console.error('[chat] - 시간:', new Date().toISOString());
      } else if (r.status === 500) {
        errorMessage = '서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.';
      } else if (r.status === 503) {
        errorMessage = '서비스가 일시적으로 사용불가합니다. 잠시 후 다시 시도해주세요.';
      } else if (r.status === 400) {
        errorMessage = '잘못된 요청입니다. 입력 내용을 확인해주세요.';
      } else if (r.status >= 500) {
        errorMessage = '서버 내부 오류가 발생했습니다.';
      }
      
      return { 
        aiResponse: `죄송합니다. ${errorMessage} (${r.status})`, 
        conversationId: body.conversationId ?? 'unknown', 
        suggestions: []
      };
    }
    
    const j = await r.json().catch(() => null);
    if (!isChatResp(j)) {
      console.warn('[chat] invalid shape:', j);
      return { 
        aiResponse: '죄송합니다. 일시적인 오류가 발생했습니다.', 
        conversationId: body.conversationId ?? 'unknown', 
        suggestions: []
      };
    }
    
    // Normalize suggestions
    j.suggestions = normalizeSuggestions(j.suggestions);
    return j;
  }
}

// ✅ 새로 추가: 서버의 /suggestions 호출
export async function fetchSuggestions(body: {
  conversationId: string;
  major: string;
  subField: string;
  suggestCount: number; // 1~5
}): Promise<string[]> {
  if (USE_LAMBDA_DIRECT) {
    // Direct Lambda call - /suggestions endpoint
    try {
      console.log('[suggestions] Lambda direct call to:', `${LAMBDA_URL}/suggestions`);
      
      const r = await fetch(`${LAMBDA_URL}/suggestions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-trace-id': makeTraceId(),
        },
        body: JSON.stringify(body),
        credentials: 'omit',
      });

      const text = await r.text();
      if (!r.ok) {
        console.warn('[suggestions] Lambda call failed:', r.status, text);
        return [];
      }

      const response = safeJsonParse(text);
      return normalizeSuggestions(response?.suggestions);
      
    } catch (error) {
      console.error('[suggestions] Lambda direct call failed:', error);
      return [];
    }
  } else {
    // Original backend call
    mustBase();
    const r = await fetch(`${BASE}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
    });
    const j = await r.json().catch(() => ({ suggestions: [] }));
    return normalizeSuggestions(j?.suggestions);
  }
}

// 유틸: 백엔드 사용 전 점검용
export async function ensureBackend() {
  console.log('[Lambda Direct Mode]', USE_LAMBDA_DIRECT);
  if (USE_LAMBDA_DIRECT) {
    console.log('[LAMBDA_URL]', LAMBDA_URL);
  } else {
    console.log('[BASE from env]', import.meta.env.VITE_BACKEND_BASE || import.meta.env.NEXT_PUBLIC_BACKEND_BASE);
    console.log('[BASE after norm]', BASE);
  }
  
  if (!USE_LAMBDA_DIRECT && !BASE) {
    throw new Error('백엔드 주소 미설정: .env(또는 Vercel env)의 VITE_BACKEND_BASE를 확인하세요.');
  }
  
  try {
    const h = await health();
    console.log('[health ok]', h);
  } catch (e) {
    console.warn('⚠️ Backend health check failed:', e);
  }
}

// Legacy compatibility exports
export const api = {
  health,
  chat,
  fetchSuggestions,
  faq: async (subField: string) => ({ faqs: [] }), // Placeholder
};

// 스트리밍 채팅 함수 - 임시로 비활성화 (Lambda 직접 호출 모드에서는 사용하지 않음)
export function streamChat(params: {
  q: string; major: string; subField: string; conversationId: string;
  onStart?: (cid: string) => void;
  onDelta?: (text: string) => void;
  onDone?: () => void;
  onError?: (msg: string) => void;
}) {
  if (USE_LAMBDA_DIRECT) {
    // Lambda 직접 호출 모드에서는 스트리밍을 지원하지 않음
    params.onError?.('현재 스트리밍 기능이 일시적으로 비활성화되었습니다. 일반 채팅을 사용해주세요.');
    return () => {};
  }
  
  // Original streaming logic (when not using Lambda direct)
  mustBase();
  
  // 입력 검증
  if (!params.q?.trim()) {
    params.onError?.('질문을 입력해주세요.');
    return () => {};
  }
  
  if (params.q.length > 1000) {
    params.onError?.('질문은 1000자 이내로 입력해주세요.');
    return () => {};
  }
  
  if (!params.major?.trim() || !params.subField?.trim()) {
    params.onError?.('전공과 세부 분야를 선택해주세요.');
    return () => {};
  }
  
  const url = new URL(`${BASE}/chat/stream`);
  url.searchParams.set("q", params.q);
  url.searchParams.set("major", params.major);
  url.searchParams.set("subField", params.subField);
  url.searchParams.set("conversationId", params.conversationId);

  let isClosed = false;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 2;
  
  const createEventSource = () => {
    if (isClosed) return null;
    
    const eventSource = new EventSource(url.toString());
    
    eventSource.onmessage = (event) => {
      if (isClosed) return;
      
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "start":
            params.onStart?.(data.conversationId);
            break;
          case "answer_delta":
            params.onDelta?.(data.text || "");
            break;
          case "done":
            eventSource.close();
            params.onDone?.();
            break;
          case "error":
            eventSource.close();
            params.onError?.(data.message || "스트리밍 오류");
            break;
          default:
            console.warn('알 수 없는 스트리밍 이벤트 타입:', data.type);
        }
      } catch (error) {
        console.warn('스트리밍 응답 파싱 오류:', error);
        // 파싱 오류는 치명적이지 않음, 계속 진행
      }
    };
    
    eventSource.onerror = (event) => {
      if (isClosed) return;
      
      console.warn('스트리밍 연결 오류:', event);
      
      // 재연결 시도
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`스트리밍 재연결 시도 ${reconnectAttempts}/${maxReconnectAttempts}`);
        
        setTimeout(() => {
          if (!isClosed) {
            eventSource.close();
            createEventSource();
          }
        }, 1000 * reconnectAttempts); // 지수 백오프
      } else {
        eventSource.close();
        params.onError?.("연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.");
      }
    };
    
    return eventSource;
  };
  
  const eventSource = createEventSource();
  
  const cleanup = () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
    }
  };
  
  // 타임아웃 설정 (5분)
  const timeoutId = setTimeout(() => {
    if (!isClosed) {
      cleanup();
      params.onError?.("응답 시간이 초과되었습니다. 다시 시도해주세요.");
    }
  }, 5 * 60 * 1000);
  
  // 정리 함수 반환
  return () => {
    clearTimeout(timeoutId);
    cleanup();
  };
}

export default { health, chat, fetchSuggestions, streamChat, ensureBackend };