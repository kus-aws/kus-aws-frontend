// SSE 스트리밍 유틸리티
export interface StreamParams {
  baseUrl: string;
  q: string;
  major: string;
  subField: string;
  conversationId: string;
  onDelta: (text: string) => void;
  onStart: (cid: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export function connectStream(params: StreamParams): () => void {
  const url = new URL(`${params.baseUrl}/chat/stream`);
  url.searchParams.set("q", params.q);
  url.searchParams.set("major", params.major);
  url.searchParams.set("subField", params.subField);
  url.searchParams.set("conversationId", params.conversationId);

  const eventSource = new EventSource(url.toString());
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "start":
          params.onStart(data.conversationId);
          break;
        case "answer_delta":
          params.onDelta(data.text || "");
          break;
        case "done":
          eventSource.close();
          params.onDone();
          break;
        case "error":
          eventSource.close();
          params.onError(data.message || "스트리밍 오류");
          break;
      }
    } catch (error) {
      // JSON 파싱 에러 무시
    }
  };
  
  eventSource.onerror = () => {
    eventSource.close();
    params.onError("연결이 원활하지 않습니다.");
  };
  
  return () => eventSource.close();
}

// 선택지 API 유틸리티
export interface SuggestionsRequest {
  conversationId: string;
  major: string;
  subField: string;
  suggestCount: number;
}

export async function fetchSuggestions(
  baseUrl: string,
  body: SuggestionsRequest
): Promise<string[]> {
  const response = await fetch(`${baseUrl}/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error("추천 질문을 불러오지 못했습니다.");
  }
  
  const data = await response.json();
  return normalizeSuggestions(data.suggestions || []);
}

function normalizeSuggestions(suggestions: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  
  for (let suggestion of suggestions) {
    suggestion = suggestion.trim();
    if (!suggestion) continue;
    
    // 140자 제한
    if (suggestion.length > 140) {
      suggestion = suggestion.substring(0, 140);
    }
    
    // 물음표 보정
    if (!suggestion.endsWith("?") && !suggestion.endsWith(".")) {
      suggestion += "?";
    }
    
    // 중복 제거 (대소문자 무시)
    const key = suggestion.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    
    normalized.push(suggestion);
    if (normalized.length >= 5) break; // 최대 5개
  }
  
  return normalized;
}