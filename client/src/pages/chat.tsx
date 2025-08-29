import { useState, useEffect, useRef, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Send, RotateCcw, AlertCircle, Lightbulb, Loader2, Star, RefreshCw } from "lucide-react";
import { getMajorCategoryById, getSubCategoryById } from "@/data/categories";
import { MessageFeedback } from "@/components/MessageFeedback";
import { SuggestionChips } from "@/components/SuggestionChips";
// New clean API implementation
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
// Define message interface
interface EnhancedMessage {
  id: string;
  content: string;
  sender: "user" | "ai" | "system";
  timestamp: Date;
  processingTime?: number;
  suggestions?: string[];
}

// import { SmartMessageContent } from "@/components/SmartMessageContent";
// import { QuestionTemplates } from "@/components/QuestionTemplates";
// import { ChatSearch } from "@/components/ChatSearch";
// import { BookmarkManager } from "@/components/BookmarkManager";
// import { FileUpload } from "@/components/FileUpload";

// Loading message component with rotating messages
function LoadingMessage() {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const loadingMessages = [
    "AI가 답변을 생성하고 있어요...",
    "잠시만 기다려주세요...",
    "최적의 답변을 준비 중입니다..."
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000); // 2초마다 메시지 변경
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="text-sm text-gray-600">
      <div className="animate-pulse">{loadingMessages[messageIndex]}</div>
    </div>
  );
}
// import { useUserStore } from "@/stores/userStore";
// import { useTheme } from "@/hooks/useTheme";

interface ChatState {
  messages: EnhancedMessage[];
  sessionId: string;
  isTyping: boolean;
  error: string | null;
  lastAIMessageId: string | null;
}

export default function Chat() {
  const [, params] = useRoute("/chat/:majorId/:subId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Backend validation on mount
  useEffect(() => {
    api.ensureBackend().catch(err => {
      console.error('❌ Backend validation failed:', err);
      toast({
        title: "백엔드 연결 오류", 
        description: err.message || "백엔드 서버에 연결할 수 없습니다.",
        variant: "destructive",
      });
    });
  }, [toast]);
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  
  const loadingMessages = [
    "AI가 답변을 생성하고 있어요...",
    "최적의 답변을 찾고 있어요...",
    "곧 완료됩니다..."
  ];
  
  // Loading message rotation effect
  useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIndex(0);
      return;
    }
    
    const interval = setInterval(() => {
      setLoadingMessageIndex((prevIndex) => 
        (prevIndex + 1) % loadingMessages.length
      );
    }, 2000); // Change message every 2 seconds
    
    return () => clearInterval(interval);
  }, [isLoading, loadingMessages.length]);
  
  // Removed SSE streaming mode - using REST API only
  
  // Removed newChat - using existing REST API system only

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleFollowupQuestion = (q: string) => {
    onSend(q);
  };

  const majorCategory = useMemo(() => 
    params?.majorId ? getMajorCategoryById(params.majorId) : null, 
    [params?.majorId]
  );
  
  const subCategory = useMemo(() => 
    params?.majorId && params?.subId 
      ? getSubCategoryById(params.majorId, params.subId) 
      : null,
    [params?.majorId, params?.subId]
  );

  useEffect(() => {
    if (params?.majorId && params?.subId && majorCategory && subCategory) {
      // Add welcome system message
      const welcomeMessage: EnhancedMessage = {
        id: `system-${Date.now()}`,
        content: `${majorCategory.name} - ${subCategory.name} 카테고리를 선택했습니다. 궁금한 것을 자유롭게 질문해보세요!`,
        sender: "system",
        timestamp: new Date(),
      };

      setMessages([welcomeMessage]);
      setError(null);
    }
  }, [params?.majorId, params?.subId, majorCategory, subCategory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Core send function using new API
  async function onSend(userQuestion: string) {
    if (!userQuestion.trim() || isLoading) return;
    if (!params?.majorId || !params?.subId) return;

    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    
    // Add user message
    const userMessage: EnhancedMessage = {
      id: `user-${Date.now()}`,
      content: userQuestion,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const res = await api.chat({
        userQuestion,
        major: params.majorId,
        subField: params.subId,
        conversationId: conversationId ?? undefined,
        followupMode: 'single',
        suggestCount: 3,
      });

      setConversationId(res.conversationId);
      
      // Add AI response
      const aiMessage: EnhancedMessage = {
        id: `ai-${Date.now()}`,
        content: String(res.aiResponse ?? ''),
        sender: "ai",
        timestamp: new Date(),
        suggestions: res.suggestions,
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Set suggestions for display
      if (Array.isArray(res.suggestions) && res.suggestions.length) {
        setSuggestions(res.suggestions);
      }
      
    } catch (e: any) {
      const errorMessage = `[API] 요청 실패: ${e?.message ?? String(e)}`;
      setError(errorMessage);
      toast({
        title: "메시지 전송 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendMessage = async (messageContent?: string) => {
    const message = messageContent || inputMessage.trim();
    if (!messageContent) {
      setInputMessage("");
    }
    await onSend(message);
  };

  // Removed handleTypingComplete - not needed with new API

  const handleClearChat = () => {
    if (majorCategory && subCategory) {
      const welcomeMessage: EnhancedMessage = {
        id: `system-${Date.now()}`,
        content: `${majorCategory.name} - ${subCategory.name} 카테고리를 선택했습니다. 궁금한 것을 자유롭게 질문해보세요!`,
        sender: "system",
        timestamp: new Date(),
      };

      setMessages([welcomeMessage]);
      setConversationId(null);
      setSuggestions([]);
      setError(null);
    }
  };

  const handleRetryLastMessage = () => {
    const lastUserMessage = [...messages]
      .reverse()
      .find(msg => msg.sender === 'user');
    
    if (lastUserMessage) {
      setInputMessage(lastUserMessage.content);
    }
  };

  // const handleQuestionTemplate = (question: string) => {
  //   setInputMessage(question);
  //   document.querySelector('[data-testid="input-message"]')?.focus();
  // };

  const handleSampleQuestion = (question: string) => {
    setInputMessage(question);
  };

  const loadSuggestions = async () => {
    setTutorState(prev => ({ ...prev, isLoadingSuggestions: true }));
    
    try {
      const suggestions = await fetchSuggestions(
        import.meta.env.VITE_API_BASE_URL || "",
        {
          conversationId: tutorState.conversationId,
          major: params?.majorId || "",
          subField: params?.subId || "",
          suggestCount: 3,
        }
      );
      
      setTutorState(prev => ({
        ...prev,
        suggestions,
        isLoadingSuggestions: false,
      }));
    } catch (error: any) {
      setTutorState(prev => ({
        ...prev,
        isLoadingSuggestions: false,
        suggestionsError: error.message,
      }));
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };
  
  const handleRetryStream = () => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages]
        .reverse()
        .find(msg => msg.sender === 'user');
      if (lastUserMessage) {
        handleSendMessage(lastUserMessage.content);
      }
    }
  };
  
  const handleRetrySuggestions = () => {
    loadSuggestions();
  };

  const handleBookmarkMessage = (message: EnhancedMessage) => {
    if (message.sender === 'ai' && majorCategory && subCategory) {
      // TODO: Implement bookmark functionality when userStore is ready
      toast({
        title: "북마크 기능",
        description: "곧 구현될 예정입니다.",
        variant: "default",
      });
    }
  };

  const handleBackToCategories = () => {
    setLocation(`/categories/${params?.majorId}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (inputMessage.trim() && !isLoading) {
          handleSendMessage();
        }
      }
      
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('[data-testid="input-message"]') as HTMLInputElement;
        input?.focus();
      }
      
      // Ctrl/Cmd + L to clear chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleClearChat();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inputMessage, isLoading]);

  const formatProcessingTime = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (!majorCategory || !subCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            잘못된 접근입니다
          </h1>
          <Button onClick={() => setLocation("/")} data-testid="button-go-home">
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToCategories}
            className="mb-4"
            data-testid="button-back-categories"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            카테고리로 돌아가기
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{majorCategory.emoji}</div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {majorCategory.name} {'>'} {subCategory.name}
                </h1>
                <p className="text-gray-600">
                  AI 튜터와 함께 학습하세요
                </p>
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
          
          {/* Connection Status - Removed, using ensureBackend() instead */}
        </div>

        {/* Sample Questions */}
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-amber-800">질문 예시</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {subCategory.sampleQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSampleQuestion(question)}
                  className="text-xs bg-white hover:bg-amber-100 border-amber-300 text-amber-700"
                  data-testid={`button-sample-${index}`}
                  disabled={false}
                >
                  {question}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>


        {/* Main Chat Interface */}
            {/* Chat Messages */}
            <Card className="mb-6 bg-white">
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" 
                      ? "justify-end" 
                      : message.sender === "system"
                      ? "justify-center"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md ${
                      message.sender === "user"
                        ? "bg-primary text-white"
                        : message.sender === "system"
                        ? "bg-amber-100 text-amber-800 text-sm"
                        : "bg-gray-100 text-gray-800"
                    } px-4 py-2 rounded-lg shadow-sm`}
                    data-testid={`message-${message.sender}-${message.id}`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${
                        message.sender === "user" 
                          ? "text-blue-100" 
                          : message.sender === "system"
                          ? "text-amber-600"
                          : "text-gray-500"
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        {message.processingTime && (
                          <span className="ml-2">({formatProcessingTime(message.processingTime)})</span>
                        )}
                      </p>
                    </div>
                    
                    {/* Actions for AI messages */}
                    {message.sender === "ai" && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between">
                          <MessageFeedback messageId={message.id} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmarkMessage(message)}
                            className="text-yellow-600 hover:text-yellow-800"
                            data-testid={`bookmark-${message.id}`}
                          >
                            <Star className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        {/* Legacy followup chips - disabled in favor of new SSE mode */}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              
              {/* AI Loading Message */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg shadow-sm max-w-xs lg:max-w-md">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm">{loadingMessages[loadingMessageIndex]}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SSE Streaming Message - Backup for future use */}
              {/*
              {(tutorState.isStreaming || tutorState.answer || tutorState.streamError) && (
                <StreamingMessage
                  state={tutorState}
                  onSuggestionClick={handleSuggestionClick}
                  onRetryStream={handleRetryStream}
                  onRetrySuggestions={handleRetrySuggestions}
                />
              )}
              */}
              
              {/* Error State */}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <SuggestionChips 
                items={suggestions} 
                onSelect={handleFollowupQuestion} 
              />
              
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="궁금한 것을 질문해보세요..."
                className="flex-1"
                disabled={isLoading}
                data-testid="input-message"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-primary text-white"
                data-testid="button-send"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            
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