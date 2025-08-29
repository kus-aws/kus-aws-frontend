// src/lib/api.ts
export const BASE = (
  import.meta.env.VITE_BACKEND_BASE || 
  import.meta.env.NEXT_PUBLIC_BACKEND_BASE || ''
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

function mustBase() {
  if (!BASE) throw new Error('백엔드 주소 미설정: .env(또는 Vercel env)의 NEXT_PUBLIC_BACKEND_BASE를 확인하세요.');
}

export async function health() {
  mustBase();
  const r = await fetch(`${BASE}/health`, { credentials: 'omit' });
  // 백엔드가 "ok" (문자열) 반환 → JSON 아닐 수 있으니 방어
  try { return await r.json(); } catch { return 'ok'; }
}

type ChatResp = { aiResponse: string; conversationId: string; suggestions?: string[] | null };

function isChatResp(x: any): x is ChatResp {
  return x && typeof x.aiResponse === 'string' && typeof x.conversationId === 'string';
}

export async function chat(body: {
  userQuestion: string; major: string; subField: string;
  conversationId?: string; followupMode?: 'never' | 'single' | 'multi'; suggestCount?: number;
}): Promise<ChatResp> {
  mustBase();
  
  // 입력 검증
  if (!body.userQuestion?.trim()) {
    throw new ApiError('질문을 입력해주세요.');
  }
  if (body.userQuestion.length > 1000) {
    throw new ApiError('질문은 1000자 이내로 입력해주세요.');
  }
  if (!body.major?.trim() || !body.subField?.trim()) {
    throw new ApiError('전공과 세부 분야를 선택해주세요.');
  }
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
    
    // 더 구체적인 오류 메시지 제공
    let errorMessage = '서버 오류가 발생했습니다.';
    if (r.status === 429) {
      errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
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
    return { aiResponse: '죄송합니다. 일시적인 오류가 발생했습니다.', conversationId: body.conversationId ?? 'unknown', suggestions: [] };
  }
  if (!Array.isArray(j.suggestions)) j.suggestions = [];
  return j;
}

export async function fetchSuggestions(body: {
  conversationId: string; major: string; subField: string; suggestCount: number;
}): Promise<string[]> {
  mustBase();
  const r = await fetch(`${BASE}/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'omit',
  });
  const j = await r.json().catch(() => ({ suggestions: [] }));
  return Array.isArray(j?.suggestions) ? j.suggestions : [];
}

// 유틸: 백엔드 사용 전 점검용
export async function ensureBackend() {
  console.log('[BASE from env]', import.meta.env.VITE_BACKEND_BASE || import.meta.env.NEXT_PUBLIC_BACKEND_BASE);
  console.log('[BASE after norm]', BASE);
  if (!BASE) throw new Error('백엔드 주소 미설정: .env(또는 Vercel env)의 VITE_BACKEND_BASE를 확인하세요.');
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
  faq: async (subField: string) => ({ faqs: [] }), // Placeholder
};

// 스트리밍 채팅 함수 추가
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