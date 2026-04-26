import DOMPurify from 'dompurify';

interface RichTextContentProps {
  content: string;
  className?: string;
}

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote', 'code', 'pre',
    'span', 'div', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style'],
  ALLOW_DATA_ATTR: false,
};

/**
 * Renders HTML content from the WYSIWYG editor safely on the frontend.
 * HTML is sanitized with DOMPurify to prevent stored XSS.
 * Falls back to plain text display if content doesn't contain HTML tags.
 */
export default function RichTextContent({ content, className = '' }: RichTextContentProps) {
  if (!content) return null;

  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  if (!hasHtml) {
    return <p className={`whitespace-pre-line ${className}`}>{content}</p>;
  }

  const clean = DOMPurify.sanitize(content, SANITIZE_CONFIG);

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
