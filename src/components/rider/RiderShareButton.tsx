import { useEffect, useState } from 'react';
import { Share2, Copy, MessageCircle, Facebook, Twitter, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RiderProfile } from '@/hooks/useRider';
import { buildRiderShareCopy } from '@/hooks/useRider';

const SHARE_BASE = 'https://s.lookmototour.com';
const CANONICAL_BASE = 'https://lookmototour.com';

interface Props {
  rider: RiderProfile;
  badge: string;
  className?: string;
}

export default function RiderShareButton({ rider, badge, className }: Props) {
  const [shareCount, setShareCount] = useState<number>(0);
  const [open, setOpen] = useState(false);

  const shareUrl = `${SHARE_BASE}/s/rider/${encodeURIComponent(rider.username)}`;
  const canonicalUrl = `${CANONICAL_BASE}/riders/${encodeURIComponent(rider.username)}`;
  const { title, text } = buildRiderShareCopy(rider, badge);
  const fullText = `${text}\n\n${canonicalUrl}`;

  useEffect(() => {
    if (!rider.user_id) return;
    supabase
      .from('share_counts')
      .select('count')
      .eq('content_type', 'rider')
      .eq('content_id', rider.user_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setShareCount(data.count);
      });
  }, [rider.user_id]);

  const trackShare = async () => {
    const { data } = await supabase.rpc('increment_share_count', {
      _content_type: 'rider',
      _content_id: rider.user_id,
    });
    if (typeof data === 'number') setShareCount(data);
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text, url: shareUrl });
      await trackShare();
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link profil berhasil disalin');
      await trackShare();
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  const openExternal = async (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    await trackShare();
  };

  const onClickShare = () => {
    if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
      handleNativeShare();
    } else {
      setOpen(true);
    }
  };

  const encodedText = encodeURIComponent(fullText);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedShort = encodeURIComponent(text);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 ${className || ''}`}
          onClick={(e) => {
            // Prefer native share when available, otherwise let dropdown open
            if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
              e.preventDefault();
              onClickShare();
            }
          }}
        >
          <Share2 className="h-4 w-4" />
          Bagikan
          {shareCount > 0 && (
            <span className="text-xs text-muted-foreground">({shareCount})</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 z-50 bg-popover">
        <DropdownMenuItem onClick={handleCopy} className="gap-2">
          <Copy className="h-4 w-4" />Salin Link
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => openExternal(`https://wa.me/?text=${encodedText}`)}
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
          className="gap-2"
        >
          <Facebook className="h-4 w-4" />Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => openExternal(`https://twitter.com/intent/tweet?text=${encodedShort}&url=${encodedUrl}`)}
          className="gap-2"
        >
          <Twitter className="h-4 w-4" />X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => openExternal(`https://t.me/share/url?url=${encodedUrl}&text=${encodedShort}`)}
          className="gap-2"
        >
          <Send className="h-4 w-4" />Telegram
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
