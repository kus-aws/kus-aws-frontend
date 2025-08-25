import { ChatRequest, ChatResponse, FeedbackRequest, HealthResponse, MajorCategory } from "@shared/schema";

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private baseUrl: string;
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt = 1
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        let errorDetails = {};
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          errorDetails = errorData.details || errorData;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        // Provide more specific error messages for common status codes
        switch (response.status) {
          case 400:
            errorMessage = `잘못된 요청: ${errorMessage}`;
            break;
          case 401:
            errorMessage = `인증이 필요합니다: ${errorMessage}`;
            break;
          case 403:
            errorMessage = `접근이 거부되었습니다: ${errorMessage}`;
            break;
          case 404:
            errorMessage = `요청한 리소스를 찾을 수 없습니다: ${errorMessage}`;
            break;
          case 429:
            errorMessage = `요청이 너무 많습니다. 잠시 후 다시 시도해주세요: ${errorMessage}`;
            break;
          case 500:
            errorMessage = `서버 오류가 발생했습니다: ${errorMessage}`;
            break;
          case 503:
            errorMessage = `서비스가 일시적으로 사용할 수 없습니다: ${errorMessage}`;
            break;
        }
        
        throw new ApiError(errorMessage, response.status, errorDetails);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Retry logic for network errors
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        await this.delay(this.retryDelay * attempt);
        return this.makeRequest<T>(endpoint, options, attempt + 1);
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        { originalError: error }
      );
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, not on client errors (4xx)
    return error instanceof TypeError || // Network error
           error.name === 'NetworkError' ||
           error.code === 'NETWORK_ERROR';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // API Methods
  async checkHealth(): Promise<HealthResponse> {
    return this.makeRequest<HealthResponse>('/api/health');
  }

  async getSubjects(): Promise<MajorCategory[]> {
    return this.makeRequest<MajorCategory[]>('/api/subjects');
  }

  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.makeRequest<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async sendFeedback(request: FeedbackRequest): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Note: Authentication endpoints removed as they're not needed for this platform

  // Utility methods for connection status
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
export { ApiError };