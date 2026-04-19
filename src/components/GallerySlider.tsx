import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

export interface GalleryImage {
  image_url: string;
  caption?: string;
}

interface GallerySliderProps {
  images: GalleryImage[];
  className?: string;
}

export default function GallerySlider({ images, className = '' }: GallerySliderProps) {
  if (!images?.length) return null;
  return (
    <div className={className}>
      <Carousel opts={{ loop: images.length > 1 }} className="w-full">
        <CarouselContent>
          {images.map((img, i) => (
            <CarouselItem key={i}>
              <figure className="relative">
                <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                  <img src={img.image_url} alt={img.caption || `Slide ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
                {img.caption && (
                  <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm px-4 py-3 rounded-b-xl">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
    </div>
  );
}
