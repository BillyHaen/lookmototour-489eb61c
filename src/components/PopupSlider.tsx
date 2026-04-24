import { useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import DOMPurify from 'dompurify';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { usePopupCampaign, markSeen, trackPopupEvent } from '@/hooks/usePopupCampaign';

export default function PopupSlider() {
  const { campaign, userId } = usePopupCampaign();
  const [open, setOpen] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const trackedSlidesRef = useRef<Set<number>>(new Set());

  // Open shortly after data loads
  useEffect(() => {
    if (!campaign || !campaign.slides || campaign.slides.length === 0) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [campaign]);

  // Track view on open
  useEffect(() => {
    if (!open || !campaign) return;
    trackPopupEvent({
      campaign_id: campaign.id,
      slide_id: campaign.slides[0]?.id ?? null,
      variant: campaign.ab_variant,
      event_type: 'view',
      user_id: userId,
    });
    trackedSlidesRef.current.add(0);
  }, [open, campaign, userId]);

  // Embla select listener
  useEffect(() => {
    if (!emblaApi || !campaign) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setSelectedIdx(idx);
      if (!trackedSlidesRef.current.has(idx)) {
        trackedSlidesRef.current.add(idx);
        const s = campaign.slides[idx];
        if (s) {
          trackPopupEvent({
            campaign_id: campaign.id,
            slide_id: s.id,
            variant: campaign.ab_variant,
            event_type: 'slide_view',
            user_id: userId,
          });
        }
      }
    };
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, campaign, userId]);

  const handleClose = (eventType: 'close' | 'dismiss_outside' = 'close') => {
    if (campaign) {
      markSeen(campaign);
      trackPopupEvent({
        campaign_id: campaign.id,
        slide_id: campaign.slides[selectedIdx]?.id ?? null,
        variant: campaign.ab_variant,
        event_type: eventType,
        user_id: userId,
      });
    }
    setOpen(false);
  };

  const handleCta = (slide: any) => {
    if (!campaign) return;
    trackPopupEvent({
      campaign_id: campaign.id,
      slide_id: slide.id,
      variant: campaign.ab_variant,
      event_type: 'click_cta',
      user_id: userId,
    });
    markSeen(campaign);
    if (slide.cta_url) {
      const url = slide.cta_url as string;
      const isExternal = /^https?:\/\//i.test(url);
      if (isExternal) window.open(url, '_blank', 'noopener,noreferrer');
      else window.location.href = url;
    }
    setOpen(false);
  };

  if (!campaign || !campaign.slides?.length) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose('dismiss_outside');
      }}
    >
      <DialogContent
        className="p-0 max-w-md w-[calc(100vw-2rem)] sm:w-full rounded-2xl overflow-hidden border-0 gap-0"
        onInteractOutside={() => handleClose('dismiss_outside')}
      >
        <button
          type="button"
          aria-label="Tutup"
          onClick={() => handleClose('close')}
          className="absolute top-2 right-2 z-20 h-9 w-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur text-foreground hover:bg-background shadow"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {campaign.slides.map((slide) => (
                <div key={slide.id} className="flex-[0_0_100%] min-w-0">
                  <div className="flex flex-col bg-card">
                    {slide.image_url && (
                      <div className="w-full bg-muted flex items-center justify-center">
                        <img
                          src={slide.image_url}
                          alt=""
                          className="w-full h-auto max-h-[55vh] object-contain"
                          loading="eager"
                        />
                      </div>
                    )}
                    {slide.content_html && (
                      <div
                        className="prose prose-sm max-w-none p-5 text-foreground [&_*]:max-w-full [&_img]:rounded-lg"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(slide.content_html),
                        }}
                      />
                    )}
                    {slide.cta_label && slide.cta_url && (
                      <div className="px-5 pb-5">
                        <Button
                          className="w-full"
                          onClick={() => handleCta(slide)}
                        >
                          {slide.cta_label}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {campaign.slides.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Sebelumnya"
                onClick={() => emblaApi?.scrollPrev()}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur shadow hover:bg-background"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Berikutnya"
                onClick={() => emblaApi?.scrollNext()}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur shadow hover:bg-background"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {campaign.slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === selectedIdx ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
