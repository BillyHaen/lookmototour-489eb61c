import { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export interface GalleryImage {
  image_url: string;
  caption?: string;
}

interface GallerySliderProps {
  images: GalleryImage[];
  className?: string;
}

export default function GallerySlider({ images, className = '' }: GallerySliderProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [lbApi, setLbApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api]);

  useEffect(() => {
    if (lightbox === null || !lbApi) return;
    lbApi.scrollTo(lightbox, true);
  }, [lbApi, lightbox]);

  if (!images?.length) return null;

  return (
    <section className={className}>
      <Carousel setApi={setApi} opts={{ loop: images.length > 1 }} className="relative">
        <CarouselContent>
          {images.map((img, i) => (
            <CarouselItem key={i}>
              <button
                type="button"
                onClick={() => setLightbox(i)}
                className="block w-full aspect-[16/10] rounded-xl overflow-hidden bg-muted"
              >
                <img
                  src={img.image_url}
                  alt={img.caption || `Foto ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </button>
              {img.caption && (
                <p className="mt-2 text-sm text-muted-foreground text-center px-2">{img.caption}</p>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2 hidden sm:flex" />
            <CarouselNext className="right-2 hidden sm:flex" />
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full px-2.5 py-0.5 text-xs font-medium">
              {current + 1}/{images.length}
            </div>
          </>
        )}
      </Carousel>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              className={`flex-shrink-0 snap-start w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border-2 transition-all ${
                current === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightbox !== null} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background border-none">
          {lightbox !== null && (
            <Carousel setApi={setLbApi} opts={{ loop: images.length > 1, startIndex: lightbox }}>
              <CarouselContent>
                {images.map((img, i) => (
                  <CarouselItem key={i}>
                    <div className="flex flex-col items-center justify-center bg-black">
                      <img
                        src={img.image_url}
                        alt={img.caption || `Foto ${i + 1}`}
                        className="w-full max-h-[80vh] object-contain"
                      />
                      {img.caption && (
                        <p className="p-3 text-sm text-center text-muted-foreground bg-background w-full">{img.caption}</p>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-3" />
                  <CarouselNext className="right-3" />
                </>
              )}
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
