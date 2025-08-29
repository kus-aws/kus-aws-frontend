// SSE Event types for chat streaming
export type SSEEvent =
  | { type: 'start'; conversationId: string }
  | { type: 'answer_delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

// Chat message types
export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  suggestions?: string[];
  messageId: string;
}

// API request/response types
export interface SuggestionsRequest {
  conversationId: string;
  major: string;
  subField: string;
  suggestCount: number;
}

export interface SuggestionsResponse {
  suggestions: string[];
}

// Error types
export interface TimeoutError {
  detail: {
    error: "bedrock_timeout";
    message?: string;
  };
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  details?: any;
}

// Offline storage types
export interface OfflineQuestion {
  question: string;
  timestamp: string;
  major: string;
  subField: string;
}