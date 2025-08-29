import React from 'react';

interface SmartMessageContentProps {
  content: string;
}

export function SmartMessageContent({ content }: SmartMessageContentProps) {
  return (
    <div className="whitespace-pre-wrap">
      {content}
    </div>
  );
}