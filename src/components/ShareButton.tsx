import { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ShareButtonProps {
  contentType: 'blog_post' | 'trip_journal' | 'event';
  contentId: string;
  title: string;
  description?: string;
  slug?: string;
}

function getPageUrl(contentType: string, slug: string): string {
  const base = window.location.origin;
  switch (contentType) {
    case 'blog_post': return `${base}/blog/${slug}`;
    case 'trip_journal': return `${base}/jurnal/${slug}`;
    case 'event': return `${base}/events/${slug}`;
    default: return base;
  }
}

export default function ShareButton({ contentType, contentId, title, description, slug }: ShareButtonProps) {
  const [shareCount, setShareCount] = useState<number>(0);

  useEffect(() => {
    if (!contentId) return;
    supabase
      .from('share_counts')
      .select('count')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setShareCount(data.count);
      });
  }, [contentType, contentId]);

  const handleShare = async () => {
    const shareUrl = getPageUrl(contentType, slug || contentId);
    const shareData: ShareData = {
      title,
      text: description || '',
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link berhasil disalin! 📋' });
      }

      const { data } = await supabase.rpc('increment_share_count', {
        _content_type: contentType,
        _content_id: contentId,
      });
      if (typeof data === 'number') setShareCount(data);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }
  };

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
      <Share2 className="h-4 w-4" />
      Bagikan
      {shareCount > 0 && (
        <span className="text-xs text-muted-foreground">({shareCount})</span>
      )}
    </Button>
  );
}
