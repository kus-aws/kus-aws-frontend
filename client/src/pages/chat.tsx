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
import { apiService, ApiError } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
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
}

export default function Chat() {
  const [, params] = useRoute("/chat/:majorId/:subId");
  const [, setLocation] = useLocation();
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    sessionId: `session-${Date.now()}`,
    isTyping: false,
    error: null,
  });
  const [inputMessage, setInputMessage] = useState("");
  const [currentTypingMessage, setCurrentTypingMessage] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  // const [fileUploadOpen, setFileUploadOpen] = useState(false);"}
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
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
      }));
    }
  }, [params?.majorId, params?.subId, majorCategory, subCategory]);

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatApi.loading || chatState.isTyping) return;
    if (!params?.majorId || !params?.subId) return;

    const messageContent = inputMessage.trim();
    const userMessage: EnhancedMessage = {
      id: `user-${Date.now()}`,
      content: messageContent,
      sender: "user",
      timestamp: new Date(),
    };

    // Add user message immediately
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      error: null,
    }));

    setInputMessage("");

    try {
      const chatRequest: ChatRequest = {
        message: messageContent,
        majorCategory: params.majorId,
        subCategory: params.subId,
        sessionId: chatState.sessionId,
      };

      const response = await chatApi.execute(
        () => apiService.sendChatMessage(chatRequest),
        {
          onSuccess: (data) => {
            // Start typing animation
            setChatState(prev => ({ ...prev, isTyping: true }));
            setCurrentTypingMessage(data.content);
          },
          onError: (error) => {
            const errorMessage = error.message || "알 수 없는 오류가 발생했습니다.";
            toast({
              title: "메시지 전송 실패",
              description: errorMessage,
              variant: "destructive",
            });
            
            // Add error message to chat
            const systemErrorMessage: EnhancedMessage = {
              id: `system-error-${Date.now()}`,
              content: `오류: ${errorMessage}`,
              sender: "system",
              timestamp: new Date(),
            };
            
            setChatState(prev => ({
              ...prev,
              messages: [...prev.messages, systemErrorMessage],
              error: errorMessage,
            }));
          }
        }
      );

      // The AI message will be added when typing animation completes
    } catch (error) {
      // Error already handled by useApi hook
      const errorMessage: EnhancedMessage = {
        id: `system-error-${Date.now()}`,
        content: "메시지 전송에 실패했습니다. 다시 시도해주세요.",
        sender: "system",
        timestamp: new Date(),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
      }));
    }
  };

  const handleTypingComplete = () => {
    if (currentTypingMessage && chatApi.data) {
      const aiMessage: EnhancedMessage = {
        id: chatApi.data.id,
        content: currentTypingMessage,
        sender: "ai",
        timestamp: new Date(chatApi.data.timestamp),
        processingTime: chatApi.data.processingTime,
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isTyping: false,
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

      setChatState({
        messages: [welcomeMessage],
        sessionId: `session-${Date.now()}`,
        isTyping: false,
        error: null,
      });
      
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
        if (inputMessage.trim() && !chatApi.loading && !chatState.isTyping) {
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
  }, [inputMessage, chatApi.loading, chatState.isTyping]);

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
                  onClick={() => handleSampleQuestion(question)}
                  className="text-xs bg-white hover:bg-amber-100 border-amber-300 text-amber-700"
                  data-testid={`button-sample-${index}`}
                >
                  {question}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

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
                      <div className="flex items-center justify-between mt-2">
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
              
              {/* Loading State */}
              {chatApi.loading && !chatState.isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg flex items-center space-x-3 min-w-[250px]">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <div className="flex-1">
                      <LoadingMessage />
                    </div>
                  </div>
                </div>
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
                disabled={chatApi.loading || chatState.isTyping}
                data-testid="input-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatApi.loading || chatState.isTyping}
                className="bg-primary text-white"
                data-testid="button-send"
              >
                {chatApi.loading ? (
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