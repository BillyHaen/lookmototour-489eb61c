import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Sparkles, Bike, Wallet, Compass, Mountain, TreePalm, Building2, Wheat } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TripMatchAnswers {
  experience: string;
  budget: string;
  style: string;
  view: string;
}

interface Step {
  key: keyof TripMatchAnswers;
  question: string;
  options: { value: string; label: string; icon: React.ReactNode; description: string }[];
}

const steps: Step[] = [
  {
    key: 'experience',
    question: 'Level riding kamu?',
    options: [
      { value: 'pemula', label: 'Pemula', icon: <Bike className="h-8 w-8" />, description: 'Baru mulai touring' },
      { value: 'menengah', label: 'Menengah', icon: <Bike className="h-8 w-8" />, description: 'Sudah beberapa kali touring' },
      { value: 'expert', label: 'Expert', icon: <Bike className="h-8 w-8" />, description: 'Rider berpengalaman' },
    ],
  },
  {
    key: 'budget',
    question: 'Budget touring kamu?',
    options: [
      { value: '<500000', label: '< 500rb', icon: <Wallet className="h-8 w-8" />, description: 'Budget hemat' },
      { value: '500000-1500000', label: '500rb - 1.5jt', icon: <Wallet className="h-8 w-8" />, description: 'Budget menengah' },
      { value: '1500000-3000000', label: '1.5jt - 3jt', icon: <Wallet className="h-8 w-8" />, description: 'Budget premium' },
      { value: '>3000000', label: '3jt+', icon: <Wallet className="h-8 w-8" />, description: 'No limit' },
    ],
  },
  {
    key: 'style',
    question: 'Gaya touring favorit?',
    options: [
      { value: 'santai', label: 'Santai & Coffee', icon: <Compass className="h-8 w-8" />, description: 'Nikmatin perjalanan & ngopi' },
      { value: 'gaspol', label: 'Gaspol Adventure', icon: <Compass className="h-8 w-8" />, description: 'Tantangan & adrenalin' },
      { value: 'luxury', label: 'Luxury', icon: <Compass className="h-8 w-8" />, description: 'Hotel bintang & fine dining' },
      { value: 'spiritual', label: 'Spiritual', icon: <Compass className="h-8 w-8" />, description: 'Wisata religi & budaya' },
    ],
  },
  {
    key: 'view',
    question: 'Pemandangan yang kamu suka?',
    options: [
      { value: 'pantai', label: 'Pantai', icon: <TreePalm className="h-8 w-8" />, description: 'Ombak & sunset' },
      { value: 'gunung', label: 'Gunung', icon: <Mountain className="h-8 w-8" />, description: 'Udara sejuk & highland' },
      { value: 'kota', label: 'Kota', icon: <Building2 className="h-8 w-8" />, description: 'Urban exploration' },
      { value: 'pedesaan', label: 'Pedesaan', icon: <Wheat className="h-8 w-8" />, description: 'Sawah & kampung' },
    ],
  },
];

interface Props {
  onSubmit: (answers: TripMatchAnswers) => void;
  isLoading: boolean;
}

export default function TripMatchQuiz({ onSubmit, isLoading }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<TripMatchAnswers>>({});

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  const selectedValue = answers[current.key];

  const handleSelect = (value: string) => {
    const updated = { ...answers, [current.key]: value };
    setAnswers(updated);

    if (step < steps.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    }
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length === steps.length) {
      onSubmit(answers as TripMatchAnswers);
    }
  };

  const canGoBack = step > 0;
  const isLastStep = step === steps.length - 1;
  const allAnswered = Object.keys(answers).length === steps.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
          <Sparkles className="h-4 w-4" /> AI Trip Match
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
          Find Your Perfect Ride
        </h1>
        <p className="text-muted-foreground">
          Jawab 4 pertanyaan, dapatkan rekomendasi touring terbaik untukmu
        </p>
      </div>

      <Progress value={progress} className="mb-8 h-2" />

      <div className="mb-4 text-sm text-muted-foreground text-center">
        {step + 1} / {steps.length}
      </div>

      <h2 className="text-xl font-bold text-center mb-6">{current.question}</h2>

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
        {current.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 md:p-6 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]",
              selectedValue === opt.value
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <div className={cn(
              "text-muted-foreground transition-colors",
              selectedValue === opt.value && "text-primary"
            )}>
              {opt.icon}
            </div>
            <span className="font-semibold text-sm md:text-base">{opt.label}</span>
            <span className="text-xs text-muted-foreground text-center">{opt.description}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => setStep(step - 1)}
          disabled={!canGoBack}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>

        {isLastStep && allAnswered && (
          <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Matching trips...
              </>
            ) : (
              <>
                Lihat Hasil <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
