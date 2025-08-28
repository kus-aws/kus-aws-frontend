import { useState, useEffect, useRef, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, RotateCcw, Lightbulb, Loader2, AlertCircle, RefreshCw, Search, Bookmark, Upload, Star } from "lucide-react";
import { getMajorCategoryById, getSubCategoryById } from "@/data/categories";
import { ChatRequest } from "@/services/api";
import { TypingAnimation } from "@/components/TypingAnimation";
import { MessageFeedback } from "@/components/MessageFeedback";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { FollowupChips } from "@/components/FollowupChips";
import { StreamingMessage, TutorState } from "@/components/StreamingMessage";
import { connectStream, fetchSuggestions } from "@/lib/streaming";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";
import { SuggestionChips } from "@/components/SuggestionChips";
import { useChat } from "@/hooks/useChat";
import { BASE, ensureBackend } from "@/lib/api";
import { apiService, ApiError } from "@/services/api";
import { useApi } from "@/hooks/useApi";
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
    ensureBackend().catch(err => {
      console.error('❌ Backend validation failed:', err);
      toast({
        title: "백엔드 연결 오류",
        description: err.message || "백엔드 서버에 연결할 수 없습니다.",
        variant: "destructive",
      });
    });
  }, [toast]);
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    sessionId: `session-${Date.now()}`,
    isTyping: false,
    error: null,
    lastAIMessageId: null,
  });
  const [inputMessage, setInputMessage] = useState("");
  const [currentTypingMessage, setCurrentTypingMessage] = useState<string | null>(null);
  const [isUsingNewChat, setIsUsingNewChat] = useState(true); // Default to SSE streaming
  
  // New SSE chat hook
  const newChat = useChat({
    major: params?.majorId || '',
    subField: params?.subId || '',
    suggestCount: 3
  });

  // ✅ 기존 ReferenceError: handleFollowupQuestion not defined 해결
  const handleFollowupQuestion = (q: string) => {
    if (isUsingNewChat) {
      newChat.send(q);
    } else {
      setInputMessage('');
      handleSendMessage(q);
    }
  };
  
  // SSE 스트리밍 상태 (legacy)
  const [tutorState, setTutorState] = useState<TutorState>({
    conversationId: `session-${Date.now()}`,
    answer: "",
    isStreaming: false,
    suggestions: [],
    isLoadingSuggestions: false,
  });
  const [streamCleanup, setStreamCleanup] = useState<(() => void) | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  // const [fileUploadOpen, setFileUploadOpen] = useState(false);"}
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const { updateProgress, addBookmark } = useUserStore();
  // const { preferences } = useTheme();
  
  const chatApi = useApi<ChatResponse>();

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

      setChatState(prev => ({
        ...prev,
        messages: [welcomeMessage],
        error: null,
        lastAIMessageId: null,
      }));
    }
  }, [params?.majorId, params?.subId, majorCategory, subCategory]);

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (messageContent?: string) => {
    const message = messageContent || inputMessage.trim();
    if (!message || tutorState.isStreaming) return;
    if (!params?.majorId || !params?.subId) return;

    const userMessage: EnhancedMessage = {
      id: `user-${Date.now()}`,
      content: message,
      sender: "user",
      timestamp: new Date(),
    };

    // Add user message and reset states
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      error: null,
      lastAIMessageId: null,
    }));

    // Clear input if using input field
    if (!messageContent) {
      setInputMessage("");
    }

    // Reset tutor state for new streaming
    setTutorState(prev => ({
      ...prev,
      answer: "",
      isStreaming: false,
      suggestions: [],
      isLoadingSuggestions: false,
      streamError: undefined,
      suggestionsError: undefined,
    }));

    // Cleanup previous stream if exists
    if (streamCleanup) {
      streamCleanup();
      setStreamCleanup(null);
    }

    // Start SSE streaming
    const cleanup = connectStream({
      baseUrl: import.meta.env.VITE_API_BASE_URL || "",
      q: message,
      major: params.majorId,
      subField: params.subId,
      conversationId: tutorState.conversationId,
      
      onStart: (cid) => {
        setTutorState(prev => ({
          ...prev,
          conversationId: cid,
          isStreaming: true,
        }));
      },
      
      onDelta: (text) => {
        setTutorState(prev => ({
          ...prev,
          answer: prev.answer + text,
        }));
      },
      
      onDone: () => {
        setTutorState(prev => ({ ...prev, isStreaming: false }));
        
        // Add AI message to chat history
        setTimeout(() => {
          const currentAnswer = tutorState.answer;
          const aiMessage: EnhancedMessage = {
            id: `ai-${Date.now()}`,
            content: currentAnswer,
            sender: "ai",
            timestamp: new Date(),
          };
          
          setChatState(prev => ({
            ...prev,
            messages: [...prev.messages, aiMessage],
            lastAIMessageId: aiMessage.id,
          }));
          
          // Load suggestions
          loadSuggestions();
        }, 100);
      },
      
      onError: (error) => {
        setTutorState(prev => ({
          ...prev,
          isStreaming: false,
          streamError: error,
        }));
        
        toast({
          title: "연결 오류",
          description: error,
          variant: "destructive",
        });
      },
    });
    
    setStreamCleanup(() => cleanup);
  };

  const handleTypingComplete = () => {
    if (currentTypingMessage && chatApi.data) {
      const aiMessage: EnhancedMessage = {
        id: chatApi.data.id,
        content: currentTypingMessage,
        sender: "ai",
        timestamp: new Date(chatApi.data.timestamp),
        processingTime: chatApi.data.processingTime,
        suggestions: chatApi.data.suggestions,
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isTyping: false,
        lastAIMessageId: aiMessage.id,
      }));
      
      setCurrentTypingMessage(null);
    }
  };

  const handleClearChat = () => {
    if (majorCategory && subCategory) {
      const welcomeMessage: EnhancedMessage = {
        id: `system-${Date.now()}`,
        content: `${majorCategory.name} - ${subCategory.name} 카테고리를 선택했습니다. 궁금한 것을 자유롭게 질문해보세요!`,
        sender: "system",
        timestamp: new Date(),
      };

      const newSessionId = `session-${Date.now()}`;
      setChatState({
        messages: [welcomeMessage],
        sessionId: newSessionId,
        isTyping: false,
        error: null,
        lastAIMessageId: null,
      });
      
      setTutorState(prev => ({
        ...prev,
        conversationId: newSessionId,
        answer: "",
        isStreaming: false,
        suggestions: [],
        isLoadingSuggestions: false,
        streamError: undefined,
        suggestionsError: undefined,
      }));
      
      setCurrentTypingMessage(null);
      chatApi.reset();
    }
  };

  const handleRetryLastMessage = () => {
    const lastUserMessage = [...chatState.messages]
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
    if (chatState.messages.length > 0) {
      const lastUserMessage = [...chatState.messages]
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
        if (inputMessage.trim() && !tutorState.isStreaming) {
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
  }, [inputMessage, tutorState.isStreaming]);

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
              {chatApi.error && (
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
          
          {/* Connection Status */}
          <div className="mt-4">
            <ConnectionStatus />
          </div>
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
                  onClick={() => isUsingNewChat ? newChat.send(question) : handleSampleQuestion(question)}
                  className="text-xs bg-white hover:bg-amber-100 border-amber-300 text-amber-700"
                  data-testid={`button-sample-${index}`}
                  disabled={isUsingNewChat ? newChat.loading : false}
                >
                  {question}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mode Toggle */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-800">채팅 모드:</span>
            <Button
              variant={!isUsingNewChat ? "default" : "outline"}
              size="sm"
              onClick={() => setIsUsingNewChat(false)}
              className="text-xs"
            >
              기존 방식
            </Button>
            <Button
              variant={isUsingNewChat ? "default" : "outline"}
              size="sm"
              onClick={() => setIsUsingNewChat(true)}
              className="text-xs"
            >
              SSE 스트리밍
            </Button>
          </div>
        </div>

        {/* New SSE Chat Interface */}
        {isUsingNewChat ? (
          <Card className="mb-6 bg-white">
            <div className="h-96 flex flex-col">
              <ChatMessages messages={newChat.messages} loading={newChat.loading} />
              {newChat.error && (
                <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-sm flex items-center justify-between">
                  <span>❌ {newChat.error}</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    새로고침
                  </Button>
                </div>
              )}
              {!newChat.loading && newChat.suggestions.length > 0 && (
                <SuggestionChips
                  items={newChat.suggestions}
                  onSelect={(suggestion) => newChat.send(suggestion)}
                />
              )}
              <ChatInput
                onSend={(message) => newChat.send(message)}
                onCancel={newChat.cancel}
                loading={newChat.loading}
              />
            </div>
          </Card>
        ) : (
          /* Legacy Chat Interface */
          <>
            {/* Chat Messages */}
            <Card className="mb-6 bg-white">
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
              {chatState.messages.map((message) => (
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
              
              {/* Typing Animation */}
              {chatState.isTyping && currentTypingMessage && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg shadow-sm max-w-xs lg:max-w-md">
                    <TypingAnimation
                      text={currentTypingMessage}
                      speed={30}
                      onComplete={handleTypingComplete}
                    />
                  </div>
                </div>
              )}
              
              {/* SSE Streaming Message */}
              {(tutorState.isStreaming || tutorState.answer || tutorState.streamError) && (
                <StreamingMessage
                  state={tutorState}
                  onSuggestionClick={handleSuggestionClick}
                  onRetryStream={handleRetryStream}
                  onRetrySuggestions={handleRetrySuggestions}
                />
              )}
              
              {/* Error State */}
              {chatApi.error && (
                <div className="flex justify-center">
                  <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{chatApi.error}</span>
                  </div>
                </div>
              )}
              
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
                disabled={tutorState.isStreaming}
                data-testid="input-message"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || tutorState.isStreaming}
                className="bg-primary text-white"
                data-testid="button-send"
              >
                {tutorState.isStreaming ? (
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
          </>
        )}
      </div>
    </div>
  );
}