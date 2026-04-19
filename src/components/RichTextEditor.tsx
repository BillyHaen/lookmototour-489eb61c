import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { useCallback, useEffect, useState } from 'react';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Heading2, Heading3, Undo, Redo, Minus, Link as LinkIcon, Unlink, Image as ImageIcon, Youtube as YoutubeIcon, FileText } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import MediaPickerDialog from '@/components/admin/MediaPickerDialog';
import type { MediaItem } from '@/hooks/useMedia';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Tulis sesuatu...', minHeight = '120px' }: RichTextEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<'image' | 'document'>('image');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline cursor-pointer' } }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg my-3 max-w-full h-auto' } }),
      Youtube.configure({ controls: true, nocookie: true, HTMLAttributes: { class: 'w-full aspect-video rounded-lg my-3' } }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || '');
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertYouTube = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL YouTube (mis: https://youtu.be/...)');
    if (!url) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }, [editor]);

  const openImagePicker = () => { setPickerType('image'); setPickerOpen(true); };
  const openDocPicker = () => { setPickerType('document'); setPickerOpen(true); };

  const handleMediaSelect = (item: MediaItem) => {
    if (!editor) return;
    if (item.file_type === 'image') {
      editor.chain().focus().setImage({ src: item.file_url, alt: item.file_name }).run();
    } else if (item.file_type === 'video') {
      // Insert raw HTML video tag via insertContent
      editor.chain().focus().insertContent(`<video src="${item.file_url}" controls class="w-full rounded-lg my-3"></video>`).run();
    } else {
      editor.chain().focus().insertContent(`<p><a href="${item.file_url}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-primary underline">📎 ${item.file_name}</a></p>`).run();
    }
  };

  if (!editor) return null;

  const ToolBtn = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <Toggle size="sm" pressed={active} onPressedChange={() => onClick()} aria-label={title} title={title} className="h-8 w-8 p-0">{children}</Toggle>
  );

  return (
    <>
      <div className="rounded-md border border-input bg-background">
        <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-border bg-muted/50">
          <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3"><Heading3 className="h-3.5 w-3.5" /></ToolBtn>
          <Separator orientation="vertical" className="mx-0.5 h-6" />
          <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></ToolBtn>
          <Separator orientation="vertical" className="mx-0.5 h-6" />
          <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List"><ListOrdered className="h-3.5 w-3.5" /></ToolBtn>
          <Separator orientation="vertical" className="mx-0.5 h-6" />
          <ToolBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align Left"><AlignLeft className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align Center"><AlignCenter className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align Right"><AlignRight className="h-3.5 w-3.5" /></ToolBtn>
          <Separator orientation="vertical" className="mx-0.5 h-6" />
          <ToolBtn active={editor.isActive('link')} onClick={setLink} title="Tautan"><LinkIcon className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Hapus Tautan"><Unlink className="h-3.5 w-3.5" /></ToolBtn>
          <Separator orientation="vertical" className="mx-0.5 h-6" />
          <ToolBtn onClick={openImagePicker} title="Sisipkan Gambar"><ImageIcon className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={insertYouTube} title="Embed YouTube"><YoutubeIcon className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={openDocPicker} title="Sisipkan Dokumen"><FileText className="h-3.5 w-3.5" /></ToolBtn>
          <Separator orientation="vertical" className="mx-0.5 h-6" />
          <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Garis Pemisah"><Minus className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo className="h-3.5 w-3.5" /></ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo className="h-3.5 w-3.5" /></ToolBtn>
        </div>
        <EditorContent editor={editor} className="prose prose-sm dark:prose-invert max-w-none px-3 py-2 focus-within:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[var(--min-h)]" style={{ '--min-h': minHeight } as React.CSSProperties} />
      </div>
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleMediaSelect}
        filterType={pickerType === 'image' ? 'image' : 'all'}
        title={pickerType === 'image' ? 'Pilih Gambar' : 'Pilih Dokumen / Media'}
      />
    </>
  );
}
