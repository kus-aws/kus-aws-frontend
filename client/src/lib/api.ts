// CORS-friendly API client for AWS Lambda backend
const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, ""); // 끝 슬래시 제거

// New backend base for SSE streaming
const BACKEND_BASE = (import.meta.env.NEXT_PUBLIC_BACKEND_BASE || "").replace(/\/+$/, "");

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

// New SSE streaming API
export async function health(): Promise<"ok"> {
  const response = await fetch(`${BACKEND_BASE}/health`, { 
    credentials: 'omit' 
  });
  return response.json();
}

export function streamChat(params: {
  q: string;
  major: string;
  subField: string;
  conversationId: string;
  onDelta: (chunk: string) => void;
  onStart?: (cid: string) => void;
  onDone?: () => void;
  onError?: (msg: string) => void;
  signal?: AbortSignal;
}): () => void {
  const { q, major, subField, conversationId, onDelta, onStart, onDone, onError, signal } = params;
  
  const url = new URL(`${BACKEND_BASE}/chat/stream`);
  url.searchParams.set('q', q);
  url.searchParams.set('major', major);
  url.searchParams.set('subField', subField);
  url.searchParams.set('conversationId', conversationId);
  
  const eventSource = new EventSource(url.toString());
  
  const cleanup = () => eventSource.close();
  
  if (signal) {
    signal.addEventListener('abort', cleanup, { once: true });
  }
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as import('./types').SSEEvent;
      
      switch (data.type) {
        case 'start':
          onStart?.(data.conversationId);
          break;
        case 'answer_delta':
          onDelta(data.text);
          break;
        case 'done':
          onDone?.();
          eventSource.close();
          break;
        case 'error':
          onError?.(data.message);
          eventSource.close();
          break;
      }
    } catch (err) {
      onError?.('Parse error');
      eventSource.close();
    }
  };
  
  eventSource.onerror = () => {
    onError?.('Connection error');
    eventSource.close();
  };
  
  return cleanup;
}

export async function fetchSuggestions(body: {
  conversationId: string;
  major: string;
  subField: string;
  suggestCount: number;
}): Promise<string[]> {
  try {
    const response = await fetch(`${BACKEND_BASE}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const json = await response.json();
    return Array.isArray(json?.suggestions) ? json.suggestions : [];
  } catch (error) {
    console.warn('Failed to fetch suggestions:', error);
    return [];
  }
}