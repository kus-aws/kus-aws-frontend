import React from 'react';
import type { ChatMessage } from '@/lib/types';

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
}

export function ChatMessages({ messages, loading }: ChatMessagesProps) {
  return (
    <div 
      className="flex-1 overflow-y-auto p-4 space-y-4"
      aria-live="polite"
      aria-label="Chat conversation"
    >
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <p className="whitespace-pre-wrap">
              {message.text}
              {message.role === 'assistant' && loading && index === messages.length - 1 && (
                <span className="inline-block w-2 h-4 ml-1 bg-gray-600 animate-pulse" />
              )}
            </p>
          </div>
        </div>
      ))}
      
      {/* Loading skeleton for first message */}
      {loading && messages.length === 1 && (
        <div className="flex justify-start">
          <div className="bg-gray-100 px-4 py-2 rounded-lg shadow-sm max-w-xs lg:max-w-md">
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse" />
              <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}