// SSE streaming API for AWS Lambda backend
export const BASE = (import.meta.env.NEXT_PUBLIC_BACKEND_BASE || '').replace(/\/$/, '');

// ❗ 어떤 경우에도 origin으로 폴백하지 않음
if (!BASE) {
  console.warn('NEXT_PUBLIC_BACKEND_BASE not set');
}

export type SSEEvent =
  | { type: 'start'; conversationId: string }
  | { type: 'answer_delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

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

type HttpMethod = "GET" | "POST";

async function request<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; signal?: AbortSignal } = {}
): Promise<T> {
  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`; // 이중 슬래시 방지
  const { method = "GET", body, signal } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      // CORS: 쿠키/자격증명 안 씀
      credentials: "omit",
      signal,
    });

    // 프리플라이트 실패 시 대부분 network error로 떨어지므로 위에서 캐치됨
    if (!res.ok) {
      // 서버가 JSON 에러 바디 주면 파싱
      let errDetail: unknown = undefined;
      try { errDetail = await res.json(); } catch { /* noop */ }
      throw new Error(
        `[API] ${method} ${path} failed: ${res.status} ${res.statusText}` +
        (errDetail ? ` :: ${JSON.stringify(errDetail)}` : "")
      );
    }

    // 건강 체크 등 단순 문자열 응답 지원
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const text = await res.text();
      return text as unknown as T;
    }
    return (await res.json()) as T;
  } catch (e: any) {
    // CORS/네트워크/타임아웃 표준화
    if (e?.name === "AbortError") {
      throw new Error("[API] Request aborted");
    }
    // chrome: TypeError: Failed to fetch / net::ERR_FAILED
    throw new Error(`[API] Network/CORS error on ${method} ${path}: ${e?.message || e}`);
  }
}

export const api = {
  health: () => request<string>("/health"),
  chat: (payload: BackendChatRequest) => request<BackendChatResponse>("/chat", { method: "POST", body: payload }),
  faq: (subField: string) => request<{ faqs: Array<{ question: string; answer: string }> }>(`/faq?subField=${encodeURIComponent(subField)}`),
};

// Updated types for followup suggestions
export interface ChatRequest {
  message: string;
  majorCategory: string;
  subCategory: string;
  sessionId?: string;
  suggestCount?: number;
  followupMode?: "never" | "single" | "multi";
}

export interface ChatResponse {
  id: string;
  content: string;
  timestamp: string;
  sessionId: string;
  processingTime: number;
  suggestions?: string[];
}

// New types for backend API
export interface BackendChatRequest {
  userQuestion: string;
  major: string;
  subField: string;
  conversationId?: string;
  suggestCount?: number;
  followupMode?: "never" | "single" | "multi";
}

export interface BackendChatResponse {
  aiResponse: string;
  conversationId: string;
  suggestions?: string[];
}

export interface FeedbackRequest {
  messageId: string;
  feedback: "like" | "dislike";
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

export interface MajorCategory {
  id: string;
  emoji: string;
  name: string;
  description: string;
  subCategories: Array<{
    id: string;
    name: string;
    description: string;
    sampleQuestions: string[];
  }>;
}

// Legacy API service for backward compatibility
class ApiService {
  private baseUrl: string = BASE;
  private retryAttempts = 3;
  private retryDelay = 1000;

  async makeRequest<T>(endpoint: string, options: any = {}): Promise<T> {
    return request<T>(endpoint, options);
  }

  shouldRetry(error: any): boolean {
    return error?.name === "NetworkError" || error?.name === "TimeoutError";
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async checkHealth(): Promise<string> {
    return api.health();
  }

  async getSubjects(): Promise<MajorCategory[]> {
    // Return static categories since we don't have /subjects endpoint
    return [];
  }

  async sendChatMessage(chatData: ChatRequest): Promise<ChatResponse> {
    const backendRequest: BackendChatRequest = {
      userQuestion: chatData.message,
      major: chatData.majorCategory,
      subField: chatData.subCategory,
      conversationId: chatData.sessionId,
      suggestCount: chatData.suggestCount ?? 3,
      followupMode: chatData.followupMode ?? "multi",
    };

    const response = await api.chat(backendRequest);
    
    return {
      id: `ai-${Date.now()}`,
      content: response.aiResponse,
      timestamp: new Date().toISOString(),
      sessionId: response.conversationId,
      processingTime: 0,
      suggestions: response.suggestions,
    };
  }

  async sendFeedback(feedbackData: FeedbackRequest): Promise<{ success: boolean; message: string }> {
    console.log(`Feedback received for message ${feedbackData.messageId}: ${feedbackData.feedback}`);
    return { success: true, message: "Feedback recorded" };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.checkHealth();
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;

export async function health() {
  if (!BASE) {
    throw new Error('백엔드 주소 미설정: .env.local의 NEXT_PUBLIC_BACKEND_BASE를 확인하세요.');
  }
  const r = await fetch(`${BASE}/health`, { credentials: 'omit' });
  // 백엔드가 "ok"를 JSON이 아닌 문자열로 주면 .json() 실패하니 .text()로 받기
  const t = await r.text().catch(() => ''); 
  return t; // "ok"
}

export async function ensureBackend() {
  if (!BASE) {
    throw new Error('백엔드 주소 미설정: .env.local의 NEXT_PUBLIC_BACKEND_BASE를 확인하세요.');
  }
  try {
    const h = await health();
    console.log('Health:', h);
  } catch (e) {
    console.warn('⚠️ Backend validation failed:', e);
    throw e;
  }
}

export function streamChat(params: {
  q: string; major: string; subField: string; conversationId: string;
  onDelta: (t: string) => void; onStart?: () => void; onDone?: () => void; onError?: (m: string) => void;
}) {
  if (!BASE) throw new Error('BACKEND_BASE_NOT_SET');
  const url = new URL(`${BASE}/chat/stream`);
  url.searchParams.set('q', params.q);
  url.searchParams.set('major', params.major);
  url.searchParams.set('subField', params.subField);
  url.searchParams.set('conversationId', params.conversationId);

  const es = new EventSource(url.toString(), { withCredentials: false });
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === 'start') params.onStart?.();
      else if (data.type === 'answer_delta') params.onDelta(data.text || '');
      else if (data.type === 'done') { params.onDone?.(); es.close(); }
      else if (data.type === 'error') { params.onError?.(data.message || 'stream error'); es.close(); }
    } catch {
      // 무시
    }
  };
  es.onerror = () => { params.onError?.('sse connection error'); es.close(); };
  return () => es.close();
}

export async function fetchSuggestions(body: {
  conversationId: string; major: string; subField: string; suggestCount: number;
}): Promise<string[]> {
  if (!BASE) throw new Error('BACKEND_BASE_NOT_SET');
  const r = await fetch(`${BASE}/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({ suggestions: [] }));
  return Array.isArray(j?.suggestions) ? j.suggestions : [];
}