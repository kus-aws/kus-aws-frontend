// src/lib/api.ts

export const BASE = (
  import.meta.env.VITE_BACKEND_BASE || 
  import.meta.env.NEXT_PUBLIC_BACKEND_BASE || 
  'https://h2yvhophi3.execute-api.us-east-1.amazonaws.com' // API Gateway URL
).replace(/\/$/, '');

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

export type SuggestionsBody = {
  conversationId: string;
  major: string;
  subField: string;
  suggestCount: number;
};

export type SuggestionsResp = {
  suggestions: string[];
};

// 타임아웃 에러 타입 추가
export type TimeoutError = {
  detail: {
    error: "bedrock_timeout";
    message?: string;
  };
};

function mustBase() {
  if (!BASE) throw new Error('백엔드 주소 미설정: .env(또는 Vercel env)의 VITE_BACKEND_BASE를 확인하세요.');
}

console.log('[API] Using backend URL:', BASE);

// Utility function to generate trace ID
function makeTraceId() {
  try { 
    return crypto.randomUUID(); 
  } catch { 
    return `trace-${Date.now()}`; 
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

// 타임아웃 에러 감지 함수
function isTimeoutError(data: any): data is TimeoutError {
  return data?.detail?.error === "bedrock_timeout";
}

// 지수 백오프 재시도 함수
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 1,
  baseDelay: number = 800
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // 지수 백오프: 800ms, 1200ms
      const delay = baseDelay * Math.pow(1.52, attempt);
      console.log(`[API] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export async function health() {
  mustBase();
  const r = await fetch(`${BASE}/health`, { 
    method: 'GET',
    credentials: 'omit' 
  });
  try { 
    return await r.json(); 
  } catch { 
    return 'ok'; 
  }
}

function isChatResp(x: any): x is ChatResp {
  return x && typeof x.aiResponse === 'string' && typeof x.conversationId === 'string';
}

function isSuggestionsResp(x: any): x is SuggestionsResp {
  return x && Array.isArray(x.suggestions);
}

export async function chat(body: ChatBody): Promise<ChatResp> {
  mustBase();
  
  const clientRequestId = makeTraceId();
  
  try {
    console.log(`[chat:${clientRequestId}] Request payload:`, body);
    console.log(`[chat:${clientRequestId}] API Gateway URL:`, `${BASE}/chat`);
    
    const r = await fetch(`${BASE}/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'x-client-request-id': clientRequestId
      },
      body: JSON.stringify({
        userQuestion: body.userQuestion,
        major: body.major,
        subField: body.subField,
        conversationId: body.conversationId,
        followupMode: body.followupMode || "never", // 기본값을 never로 변경
        suggestCount: body.suggestCount || 0        // 기본값을 0으로 변경
      }),
      credentials: 'omit',
    });

    // 에러 로깅 개선 (텍스트/JSON 동시)
    const ct = r.headers.get("content-type") || "";
    const raw = await r.text();
    let data = null;
    
    try { 
      if (ct.includes("application/json")) {
        data = JSON.parse(raw); 
      }
    } catch (e) {
      console.warn(`[chat:${clientRequestId}] JSON parse failed:`, e);
    }

    // 타임아웃 에러 특별 처리
    if (r.status === 504) {
      console.error(`[chat:${clientRequestId}] 504 Gateway Timeout - Request payload:`, body);
      console.error(`[chat:${clientRequestId}] Response:`, raw);
      
      if (data && isTimeoutError(data)) {
        throw new ApiError('지금 답변 생성이 지연되고 있어요. 잠시 후 다시 시도해 주세요.', 504, data);
      } else {
        throw new ApiError('서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.', 504, { raw });
      }
    }

    if (!r.ok) {
      console.error(`[chat:${clientRequestId}] HTTP ${r.status} - Request payload:`, body);
      console.error(`[chat:${clientRequestId}] Response:`, raw);
      throw new ApiError(`HTTP ${r.status}: ${raw || 'Internal Server Error'}`, r.status, { raw, payload: body });
    }

    // 응답 검증
    if (!data) {
      throw new Error('서버 응답을 파싱할 수 없습니다.');
    }

    if (!isChatResp(data)) {
      console.warn(`[chat:${clientRequestId}] invalid response shape:`, data);
      return {
        aiResponse: '죄송합니다. 일시적인 오류가 발생했습니다.',
        conversationId: body.conversationId ?? 'unknown',
        suggestions: []
      };
    }

    console.log(`[chat:${clientRequestId}] Response:`, data);
    
    return data as ChatResp;

  } catch (error) {
    console.error(`[chat:${clientRequestId}] Request failed:`, error);
    throw error;
  }
}

export async function fetchSuggestions(body: SuggestionsBody): Promise<string[]> {
  mustBase();
  
  const clientRequestId = makeTraceId();
  
  try {
    console.log(`[suggestions:${clientRequestId}] Request payload:`, body);
    console.log(`[suggestions:${clientRequestId}] API Gateway URL:`, `${BASE}/suggestions`);
    
    const r = await fetch(`${BASE}/suggestions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-client-request-id': clientRequestId
      },
      body: JSON.stringify(body),
      credentials: 'omit',
    });

    // 에러 로깅 개선 (텍스트/JSON 동시)
    const ct = r.headers.get("content-type") || "";
    const raw = await r.text();
    let data = null;
    
    try { 
      if (ct.includes("application/json")) {
        data = JSON.parse(raw); 
      }
    } catch (e) {
      console.warn(`[suggestions:${clientRequestId}] JSON parse failed:`, e);
    }

    if (!r.ok) {
      console.error(`[suggestions:${clientRequestId}] HTTP ${r.status} - Request payload:`, body);
      console.error(`[suggestions:${clientRequestId}] Response:`, raw);
      return []; // suggestions 실패 시 빈 배열 반환
    }

    // 응답 검증
    if (!data) {
      console.warn(`[suggestions:${clientRequestId}] No data received`);
      return [];
    }

    if (!isSuggestionsResp(data)) {
      console.warn(`[suggestions:${clientRequestId}] invalid response shape:`, data);
      return [];
    }

    console.log(`[suggestions:${clientRequestId}] Response:`, data);
    return normalizeSuggestions((data as SuggestionsResp).suggestions);

  } catch (error) {
    console.error(`[suggestions:${clientRequestId}] Request failed:`, error);
    return []; // 에러 시 빈 배열 반환
  }
}

// 유틸: 백엔드 사용 전 점검용
export async function ensureBackend() {
  console.log('[API Gateway Mode]', true);
  console.log('[BASE from env]', import.meta.env.VITE_BACKEND_BASE || import.meta.env.NEXT_PUBLIC_BACKEND_BASE);
  console.log('[BASE after norm]', BASE);
  
  if (!BASE) {
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

// 스트리밍 채팅 함수 (API Gateway 모드) - 5초 타임아웃 가드 추가
export function streamChat(params: {
  q: string; major: string; subField: string; conversationId: string;
  onStart?: (cid: string) => void;
  onDelta?: (text: string) => void;
  onDone?: () => void;
  onError?: (msg: string) => void;
}) {
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
  let hasReceivedDelta = false;
  let deltaTimeoutId: NodeJS.Timeout;
  
  const createEventSource = () => {
    if (isClosed) return null;
    
    const eventSource = new EventSource(url.toString());
    
    // 5초 내 answer_delta 수신 없으면 폴백
    deltaTimeoutId = setTimeout(() => {
      if (!hasReceivedDelta && !isClosed) {
        console.warn('[streamChat] No answer_delta received within 5s, falling back to non-streaming');
        eventSource.close();
        params.onError?.('스트리밍 응답이 지연되어 일반 모드로 전환합니다.');
      }
    }, 5000);
    
    eventSource.onmessage = (event) => {
      if (isClosed) return;
      
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "start":
            params.onStart?.(data.conversationId);
            break;
          case "answer_delta":
            hasReceivedDelta = true;
            clearTimeout(deltaTimeoutId);
            params.onDelta?.(data.text || "");
            break;
          case "done":
            clearTimeout(deltaTimeoutId);
            eventSource.close();
            params.onDone?.();
            break;
          case "error":
            clearTimeout(deltaTimeoutId);
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
        clearTimeout(deltaTimeoutId);
        eventSource.close();
        params.onError?.("연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요.");
      }
    };
    
    return eventSource;
  };
  
  const eventSource = createEventSource();
  
  const cleanup = () => {
    isClosed = true;
    clearTimeout(deltaTimeoutId);
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