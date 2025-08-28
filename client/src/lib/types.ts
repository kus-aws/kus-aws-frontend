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