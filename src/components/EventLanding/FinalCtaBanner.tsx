import { Button } from '@/components/ui/button';

interface Props {
  ctaLabel: string;
  spotsLeft?: number;
  onCtaClick?: () => void;
}

export default function FinalCtaBanner({ ctaLabel, spotsLeft, onCtaClick }: Props) {
  return (
    <section className="my-12 rounded-2xl bg-gradient-hero text-primary-foreground p-6 sm:p-8 md:p-12 text-center">
      <h2 className="font-heading font-bold text-2xl md:text-4xl mb-3">Siap Untuk Petualangan Berikutnya?</h2>
      <p className="opacity-90 mb-6 max-w-xl mx-auto text-sm sm:text-base">
        {spotsLeft && spotsLeft > 0
          ? `Hanya ${spotsLeft} slot tersisa. Amankan tempatmu sekarang sebelum kehabisan.`
          : 'Bergabunglah bersama riders lainnya. Slot terbatas — jangan tunggu nanti.'}
      </p>
      <Button
        size="lg"
        variant="secondary"
        onClick={onCtaClick}
        className="gap-2 text-sm sm:text-base font-semibold w-full sm:w-auto max-w-full whitespace-normal h-auto min-h-11 py-3 px-4 sm:px-8 break-words text-center"
      >
        <span className="break-words">{ctaLabel || '🔥 Join The Ride – Apply Now'}</span>
      </Button>
    </section>
  );
}
