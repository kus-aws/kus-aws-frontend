import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Calendar, User, Bot } from 'lucide-react';
import { EnhancedMessage } from '@shared/schema';
import Fuse from 'fuse.js';

interface ChatSearchProps {
  messages: EnhancedMessage[];
  onSelectMessage: (messageId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatSearch({ messages, onSelectMessage, isOpen, onClose }: ChatSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSender, setFilterSender] = useState<'all' | 'user' | 'ai'>('all');

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    const filteredMessages = messages.filter(msg => 
      msg.sender !== 'system' && 
      (filterSender === 'all' || msg.sender === filterSender)
    );

    return new Fuse(filteredMessages, {
      keys: ['content'],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
    });
  }, [messages, filterSender]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return messages
        .filter(msg => msg.sender !== 'system' && (filterSender === 'all' || msg.sender === filterSender))
        .slice(-20); // Show last 20 messages when no search
    }

    return fuse.search(searchTerm).map(result => result.item);
  }, [searchTerm, fuse, messages, filterSender]);

  const handleMessageClick = (messageId: string) => {
    onSelectMessage(messageId);
    onClose();
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="chat-search-overlay">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardContent className="p-0">
          {/* Search Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>채팅 내역 검색</span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                data-testid="close-search"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="채팅 내용 검색..."
                className="pl-10"
                data-testid="search-input"
                autoFocus
              />
            </div>

            {/* Filters */}
            <div className="flex space-x-2">
              <Button
                variant={filterSender === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSender('all')}
                data-testid="filter-all"
              >
                전체
              </Button>
              <Button
                variant={filterSender === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSender('user')}
                className="flex items-center space-x-1"
                data-testid="filter-user"
              >
                <User className="w-3 h-3" />
                <span>내 질문</span>
              </Button>
              <Button
                variant={filterSender === 'ai' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSender('ai')}
                className="flex items-center space-x-1"
                data-testid="filter-ai"
              >
                <Bot className="w-3 h-3" />
                <span>AI 답변</span>
              </Button>
            </div>
          </div>

          {/* Search Results */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? '검색 결과가 없습니다.' : '검색어를 입력해주세요.'}
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((message, index) => (
                  <div
                    key={`${message.id}-${index}`}
                    onClick={() => handleMessageClick(message.id)}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    data-testid={`search-result-${index}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {message.sender === 'user' ? (
                          <User className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Bot className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-sm font-medium capitalize">
                          {message.sender === 'user' ? '사용자' : 'AI'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {message.timestamp.toLocaleDateString()} {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                      {highlightText(message.content, searchTerm)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results Summary */}
          {searchResults.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {searchResults.length}개의 메시지 발견
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}