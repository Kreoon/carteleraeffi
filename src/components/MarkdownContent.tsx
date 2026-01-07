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

// Basic markdown parsing for bold, italic, and line breaks
function parseBasicMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split by line breaks first
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Parse bold (**text**)
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let parsedLine: React.ReactNode[] = [];
    let lastIdx = 0;
    let match;
    let partKey = 0;

    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIdx) {
        parsedLine.push(line.slice(lastIdx, match.index));
      }
      parsedLine.push(
        <strong key={`bold-${partKey++}`}>{match[1]}</strong>
      );
      lastIdx = match.index + match[0].length;
    }
    
    if (lastIdx < line.length) {
      parsedLine.push(line.slice(lastIdx));
    }

    if (parsedLine.length === 0) {
      parsedLine.push(line);
    }

    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {parsedLine}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}
