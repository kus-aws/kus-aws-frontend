import { useEffect, useRef } from 'react';
import Prism from 'prismjs';

// Import language definitions - only available ones
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';

// Import theme
import 'prismjs/themes/prism.css';

interface CodeHighlightProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeHighlight({ code, language = 'javascript', className = '' }: CodeHighlightProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current && code) {
      try {
        Prism.highlightElement(codeRef.current);
      } catch (error) {
        console.warn('Prism highlighting error:', error);
      }
    }
  }, [code, language]);

  return (
    <pre className={`rounded-lg overflow-x-auto ${className}`}>
      <code ref={codeRef} className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
}

// Helper function to detect programming language from text
export function detectLanguage(text: string): string {
  const patterns = [
    { pattern: /def\s+\w+\s*\(.*\):|import\s+\w+|from\s+\w+\s+import/, language: 'python' },
    { pattern: /function\s+\w+\s*\(.*\)|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=/, language: 'javascript' },
    { pattern: /interface\s+\w+|type\s+\w+\s*=|enum\s+\w+/, language: 'typescript' },
    { pattern: /public\s+class\s+\w+|public\s+static\s+void\s+main/, language: 'java' },
    { pattern: /#include\s*<.*>|int\s+main\s*\(.*\)|std::/, language: 'cpp' },
    { pattern: /SELECT\s+.*\s+FROM|INSERT\s+INTO|UPDATE\s+.*\s+SET/i, language: 'sql' },
    { pattern: /<\w+.*>.*<\/\w+>|<!DOCTYPE|<html/, language: 'html' },
    { pattern: /\{[\s\S]*"[\w-]+"[\s\S]*:[\s\S]*\}/, language: 'json' },
  ];

  for (const { pattern, language } of patterns) {
    if (pattern.test(text)) {
      return language;
    }
  }

  return 'text';
}