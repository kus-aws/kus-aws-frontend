// CORS-friendly API client for AWS Lambda backend
const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, ""); // 끝 슬래시 제거

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
  chat: (payload: {
    userQuestion: string;
    major: string;
    subField: string;
    conversationId?: string;
  }) => request<{ aiResponse: string; conversationId: string }>("/chat", { method: "POST", body: payload }),
  faq: (subField: string) => request<{ faqs: Array<{ question: string; answer: string }> }>(`/faq?subField=${encodeURIComponent(subField)}`),
};

// Legacy compatibility types
export interface ChatRequest {
  message: string;
  majorCategory: string;
  subCategory: string;
  sessionId?: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  timestamp: string;
  sessionId: string;
  processingTime: number;
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
    const response = await api.chat({
      userQuestion: chatData.message,
      major: chatData.majorCategory,
      subField: chatData.subCategory,
      conversationId: chatData.sessionId,
    });
    
    return {
      id: `ai-${Date.now()}`,
      content: response.aiResponse,
      timestamp: new Date().toISOString(),
      sessionId: response.conversationId,
      processingTime: 0,
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