import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  math: string;
  inline?: boolean;
  className?: string;
}

export function MathRenderer({ math, inline = false, className = '' }: MathRendererProps) {
  const mathRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mathRef.current && math) {
      try {
        mathRef.current.innerHTML = '';
        katex.render(math, mathRef.current, {
          displayMode: !inline,
          throwOnError: false,
          errorColor: '#cc0000',
          strict: 'warn',
        });
      } catch (error) {
        console.warn('KaTeX rendering error:', error);
        if (mathRef.current) {
          mathRef.current.textContent = math;
        }
      }
    }
  }, [math, inline]);

  const Component = inline ? 'span' : 'div';

  return (
    <Component
      ref={mathRef}
      className={`math-renderer ${inline ? 'inline-math' : 'display-math'} ${className}`}
      aria-label={`수학 공식: ${math}`}
    />
  );
}

// Helper function to detect and parse LaTeX math expressions
export function parseMathContent(text: string): Array<{ type: 'text' | 'math'; content: string; inline?: boolean }> {
  const parts: Array<{ type: 'text' | 'math'; content: string; inline?: boolean }> = [];
  
  // Pattern for inline math: $...$ or \\(...\\)
  // Pattern for display math: $$...$$ or \\[...\\]
  const mathPattern = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$\n]*?\$|\\\([^)]*?\\\))/g;
  
  let lastIndex = 0;
  let match;

  while ((match = mathPattern.exec(text)) !== null) {
    // Add text before math
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index);
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }

    // Add math content
    const mathContent = match[1];
    let cleanMath = mathContent;
    let isInline = true;

    if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
      cleanMath = mathContent.slice(2, -2);
      isInline = false;
    } else if (mathContent.startsWith('\\[') && mathContent.endsWith('\\]')) {
      cleanMath = mathContent.slice(2, -2);
      isInline = false;
    } else if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
      cleanMath = mathContent.slice(1, -1);
      isInline = true;
    } else if (mathContent.startsWith('\\(') && mathContent.endsWith('\\)')) {
      cleanMath = mathContent.slice(2, -2);
      isInline = true;
    }

    parts.push({ type: 'math', content: cleanMath, inline: isInline });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}