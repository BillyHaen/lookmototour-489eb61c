import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TripMatchQuiz, { type TripMatchAnswers } from '@/components/TripMatchQuiz';
import TripMatchResults from '@/components/TripMatchResults';
import { useEvents } from '@/hooks/useEvents';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MatchResult {
  categories: { label: string; emoji: string; event_ids: string[] }[];
  reasons: Record<string, string>;
}

export default function TripMatch() {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const { data: events = [] } = useEvents();

  useSeoMeta({
    title: 'AI Trip Match - Find Your Perfect Ride | LookMotoTour',
    description: 'Temukan touring motor terbaik untukmu dengan AI Trip Match. Jawab 4 pertanyaan dan dapatkan rekomendasi personalisasi.',
  });

  const { data: interestCounts = {} } = useQuery({
    queryKey: ['event-interest-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_event_interest_counts');
      if (error) return {};
      const map: Record<string, number> = {};
      (data as any[])?.forEach((r: any) => { map[r.event_id] = Number(r.interest_count); });
      return map;
    },
  });

  const handleSubmit = async (answers: TripMatchAnswers) => {
    setIsMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-trip-match', {
        body: { answers, events },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as MatchResult);
    } catch (err: any) {
      console.error('Trip match error:', err);
      toast.error(err.message || 'Gagal mendapatkan rekomendasi. Coba lagi.');
    } finally {
      setIsMatching(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {result ? (
          <TripMatchResults
            categories={result.categories}
            reasons={result.reasons}
            events={events}
            interestCounts={interestCounts}
            onReset={handleReset}
          />
        ) : (
          <TripMatchQuiz onSubmit={handleSubmit} isLoading={isMatching} />
        )}
      </main>
      <Footer />
    </div>
  );
}
