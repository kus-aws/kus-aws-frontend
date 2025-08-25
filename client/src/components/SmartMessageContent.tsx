import { CodeHighlight, detectLanguage } from './CodeHighlight';
import { MathRenderer, parseMathContent } from './MathRenderer';

interface SmartMessageContentProps {
  content: string;
  className?: string;
}

export function SmartMessageContent({ content, className = '' }: SmartMessageContentProps) {
  // First check if the entire content is a code block
  const codeBlockMatch = content.match(/^```(\w+)?\n([\s\S]*?)\n?```$/);
  if (codeBlockMatch) {
    const language = codeBlockMatch[1] || detectLanguage(codeBlockMatch[2]);
    return (
      <div className={className}>
        <CodeHighlight code={codeBlockMatch[2]} language={language} />
      </div>
    );
  }

  // Parse for mixed content (text, inline code, and math)
  const parts = parseMathContent(content);
  
  return (
    <div className={`smart-content ${className}`}>
      {parts.map((part, index) => {
        if (part.type === 'math') {
          return (
            <MathRenderer
              key={index}
              math={part.content}
              inline={part.inline}
            />
          );
        }

        // Handle text that might contain inline code
        const textContent = part.content;
        const inlineCodePattern = /`([^`]+)`/g;
        const textParts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = inlineCodePattern.exec(textContent)) !== null) {
          // Add text before code
          if (match.index > lastIndex) {
            textParts.push(textContent.slice(lastIndex, match.index));
          }

          // Add inline code
          textParts.push(
            <code
              key={`code-${index}-${match.index}`}
              className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono"
            >
              {match[1]}
            </code>
          );

          lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < textContent.length) {
          textParts.push(textContent.slice(lastIndex));
        }

        return (
          <span key={index} className="whitespace-pre-wrap">
            {textParts.length > 0 ? textParts : textContent}
          </span>
        );
      })}
    </div>
  );
}