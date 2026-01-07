import React from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

// Parse markdown content and render images properly
export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  if (!content || typeof content !== 'string') {
    return <span className={className}>{content || '-'}</span>;
  }

  // Check if content contains markdown image syntax
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  if (!imageRegex.test(content)) {
    // No images, return as-is with basic markdown parsing
    return <span className={className}>{parseBasicMarkdown(content)}</span>;
  }

  // Reset regex
  imageRegex.lastIndex = 0;

  // Parse content with images
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = imageRegex.exec(content)) !== null) {
    // Add text before the image
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push(
          <span key={`text-${key++}`}>
            {parseBasicMarkdown(textBefore)}
          </span>
        );
      }
    }

    // Add the image
    const altText = match[1];
    const imageUrl = match[2];
    parts.push(
      <img
        key={`img-${key++}`}
        src={imageUrl}
        alt={altText || 'Imagen'}
        className="max-w-full h-auto rounded-lg my-2 border shadow-sm"
        style={{ maxHeight: '300px', objectFit: 'contain' }}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last image
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex);
    if (textAfter.trim()) {
      parts.push(
        <span key={`text-${key++}`}>
          {parseBasicMarkdown(textAfter)}
        </span>
      );
    }
  }

  return <div className={`space-y-2 ${className}`}>{parts}</div>;
}

// Basic markdown parsing for bold, italic, URLs, and line breaks
function parseBasicMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split by line breaks first
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    const parsedLine = parseLineContent(line);

    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {parsedLine}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

// Parse a single line for bold text and URLs
function parseLineContent(line: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  
  // Combined regex for bold and URLs
  const combinedRegex = /(\*\*[^*]+\*\*)|(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
  
  let lastIdx = 0;
  let match;
  let partKey = 0;

  while ((match = combinedRegex.exec(line)) !== null) {
    // Add text before the match
    if (match.index > lastIdx) {
      result.push(line.slice(lastIdx, match.index));
    }

    if (match[1]) {
      // Bold text
      const boldText = match[1].slice(2, -2); // Remove ** from both ends
      result.push(
        <strong key={`bold-${partKey++}`}>{boldText}</strong>
      );
    } else if (match[2]) {
      // URL
      result.push(
        <a
          key={`url-${partKey++}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {match[2]}
        </a>
      );
    }

    lastIdx = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIdx < line.length) {
    result.push(line.slice(lastIdx));
  }

  if (result.length === 0) {
    result.push(line);
  }

  return result;
}
