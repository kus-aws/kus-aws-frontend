import { useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Send, RotateCcw, AlertCircle, Lightbulb, Loader2, RefreshCw } from "lucide-react";
import { MessageFeedback } from "@/components/MessageFeedback";
import { SuggestionChips } from "@/components/SuggestionChips";
import { useChat } from "@/hooks/useChat";
import { getMajorCategoryById, getSubCategoryById } from "@/data/categories";

export default function Chat() {
  const [, params] = useRoute("/chat/:majorId/:subId");
  const [, setLocation] = useLocation();
  
  // Get major and sub category from route params
  const majorId = params?.majorId;
  const subId = params?.subId;
  
  const majorCategory = useMemo(() => 
    majorId ? getMajorCategoryById(majorId) : null, [majorId]
  );
  
  const subCategory = useMemo(() => 
    majorId && subId ? getSubCategoryById(majorId, subId) : null, [majorId, subId]
  );

  // Backend validation on mount
  useEffect(() => {
    if (majorCategory && subCategory) {
      // Initialize chat with proper categories
      console.log('[Chat] Initialized with:', { major: majorCategory.name, subField: subCategory.name });
    }
  }, [majorCategory, subCategory]);

  // Use the enhanced useChat hook
  const { 
    messages, 
    loading, 
    error, 
    send
  } = useChat({
    major: majorCategory?.name || '',
    subField: subCategory?.name || '',
    suggestCount: 3,
    conversationId: undefined, // Let useChat manage this
  });

  const [inputMessage, setInputMessage] = useState("");

  // Handle input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;
    
    const question = inputMessage.trim();
    setInputMessage('');
    await send(question);
  };

  // Handle suggestion chip click
  const handleSuggestionClick = async (suggestion: string) => {
    if (loading) return;
    await send(suggestion);
  };

  // Handle sample question click
  const handleSampleQuestion = async (question: string) => {
    if (loading) return;
    await send(question);
  };

  // Handle clear chat
  const handleClearChat = () => {
    // Reset conversation
    window.location.reload();
  };

  // Handle retry last message
  const handleRetryLastMessage = () => {
    const lastUserMessage = messages
      .filter(m => m.role === 'user')
      .pop();
    
    if (lastUserMessage) {
      send(lastUserMessage.text);
    }
  };

  // Redirect if invalid route
  if (!majorCategory || !subCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">카테고리를 찾을 수 없습니다</h1>
          <Button onClick={() => setLocation("/")}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>카테고리로 돌아가기</span>
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">💻</span>
                <span className="font-medium">{majorCategory.name}</span>
                <span className="text-gray-400">&gt;</span>
                <span className="font-medium">{subCategory.name}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {error && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryLastMessage}
                  className="flex items-center space-x-2"
                  data-testid="button-retry"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>재시도</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleClearChat}
                className="flex items-center space-x-2"
                data-testid="button-clear-chat"
              >
                <RotateCcw className="w-4 h-4" />
                <span>대화 초기화</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Welcome Message */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-blue-800">
                {majorCategory.name} - {subCategory.name} 카테고리를 선택했습니다
              </h2>
            </div>
            <p className="text-blue-700">
              AI 튜터와 함께 학습하세요. 궁금한 것을 자유롭게 질문해보세요!
            </p>
          </CardContent>
        </Card>

        {/* Sample Questions */}
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">질문 예시</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {subCategory.sampleQuestions?.map((question: string, index: number) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSampleQuestion(question)}
                  className="text-xs bg-white hover:bg-amber-100 border-amber-300 text-amber-700"
                  data-testid={`button-sample-${index}`}
                  disabled={loading}
                >
                  {question}
                </Button>
              )) || (
                <p className="text-sm text-gray-500">예시 질문이 없습니다</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Messages */}
        <Card className="mb-6 bg-white">
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
              {messages.map((message, index) => (
                <div
                  key={message.messageId}
                  className={`flex ${
                    message.role === "user" 
                      ? "justify-end" 
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-800"
                    } px-4 py-2 rounded-lg shadow-sm`}
                    data-testid={`message-${message.role}-${index}`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    
                    {/* AI 메시지에 연계 질문 칩 표시 */}
                    {message.role === "assistant" && message.suggestions && message.suggestions.length > 0 && (
                      <SuggestionChips 
                        items={message.suggestions} 
                        onSelect={handleSuggestionClick} 
                        disabled={loading}
                        className="mt-3"
                      />
                    )}
                    
                    {/* Actions for AI messages */}
                    {message.role === "assistant" && (
                      <div className="mt-2">
                        <MessageFeedback 
                          messageId={message.messageId}
                          onFeedback={(type, msgId) => {
                            console.log('Feedback:', type, msgId);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg shadow-sm max-w-xs lg:max-w-md">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AI가 답변을 생성하고 있습니다...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error display */}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="궁금한 것을 질문해보세요..."
                className="flex-1"
                disabled={loading}
                data-testid="input-message"
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="bg-primary text-white"
                data-testid="button-send"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            
            {/* Input hints */}
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Enter를 눌러 전송 • Shift+Enter로 줄바꿈</span>
                <span className="text-gray-400">Ctrl+K: 입력창 포커스</span>
              </div>
              <div className="text-gray-400">
                Ctrl+Enter: 빠른 전송 • Ctrl+L: 대화 초기화
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}