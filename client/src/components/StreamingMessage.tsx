import React from 'react';
import { Button } from '@/components/ui/button';

export interface TutorState {
  conversationId: string;
  answer: string;          // 스트리밍 누적 텍스트
  isStreaming: boolean;    // start~done 사이 true
  suggestions: string[];   // /suggestions 응답
  isLoadingSuggestions: boolean;
  streamError?: string;
  suggestionsError?: string;
}

interface StreamingMessageProps {
  state: TutorState;
  onSuggestionClick: (suggestion: string) => void;
  onRetryStream: () => void;
  onRetrySuggestions: () => void;
}

export function StreamingMessage({ 
  state, 
  onSuggestionClick, 
  onRetryStream, 
  onRetrySuggestions 
}: StreamingMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg shadow-sm max-w-xs lg:max-w-md">
        {/* 스트리밍 중 또는 완료된 답변 */}
        {state.answer && (
          <div className="whitespace-pre-wrap">{state.answer}</div>
        )}
        
        {/* 스트리밍 중 로딩 인디케이터 */}
        {state.isStreaming && (
          <div className="text-xs text-gray-500 mt-1 animate-pulse flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-bounce"></div>
            생성 중...
          </div>
        )}
        
        {/* 스트리밍 에러 */}
        {state.streamError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <div className="flex items-center justify-between">
              <span>{state.streamError}</span>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onRetryStream}
                className="text-red-700 hover:bg-red-100 ml-2"
              >
                다시 시도
              </Button>
            </div>
          </div>
        )}
        
        {/* 연계 질문 섹션 */}
        {!state.isStreaming && !state.streamError && state.answer && (
          <div className="mt-3">
            {/* 선택지 로딩 */}
            {state.isLoadingSuggestions && (
              <div className="text-xs text-gray-500 animate-pulse">
                연계 질문을 준비 중...
              </div>
            )}
            
            {/* 선택지 표시 */}
            {!state.isLoadingSuggestions && state.suggestions.length > 0 && (
              <div>
                <div className="text-xs text-gray-600 mb-2">연계 질문</div>
                <div className="flex flex-wrap gap-2">
                  {state.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => onSuggestionClick(suggestion)}
                      className="text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-700 max-w-full"
                      title={suggestion}
                    >
                      <span className="truncate">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* 선택지 에러 */}
            {state.suggestionsError && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-700 text-sm">
                <div className="flex items-center justify-between">
                  <span>추천 질문을 불러오지 못했습니다.</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={onRetrySuggestions}
                    className="text-orange-700 hover:bg-orange-100 ml-2"
                  >
                    재시도
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}