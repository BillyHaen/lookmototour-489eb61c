interface RichTextContentProps {
  content: string;
  className?: string;
}

/**
 * Renders HTML content from the WYSIWYG editor safely on the frontend.
 * Falls back to plain text display if content doesn't contain HTML tags.
 */
export default function RichTextContent({ content, className = '' }: RichTextContentProps) {
  if (!content) return null;

  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  if (!hasHtml) {
    return <p className={`whitespace-pre-line ${className}`}>{content}</p>;
  }

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
