import type { GalleryImage } from '@/components/admin/GalleryEditor';

interface Props {
  gallery: GalleryImage[];
}

export default function GallerySection({ gallery }: Props) {
  if (!gallery?.length) return null;
  return (
    <section className="py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {gallery.map((img, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
            <img
              src={img.url}
              alt={img.alt || `Gallery image ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
