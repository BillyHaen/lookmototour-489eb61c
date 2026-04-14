import { useMemo } from 'react';
import type { DbEvent } from '@/hooks/useEvents';

interface ScoredEvent {
  event: DbEvent;
  score: number;
  reasons: string[];
}

/**
 * Scores and returns recommended events based on similarity to a reference event.
 * Scoring: touring_style match (+3), rider_level match (+3), motor_types overlap (+2 each),
 * same category (+2), same difficulty (+1).
 */
export function useRecommendedEvents(
  currentEvent: DbEvent | null | undefined,
  allEvents: DbEvent[] | undefined,
  limit = 3
): ScoredEvent[] {
  return useMemo(() => {
    if (!currentEvent || !allEvents || allEvents.length <= 1) return [];

    const current = currentEvent as any;

    return allEvents
      .filter((e) => e.id !== currentEvent.id && e.status !== 'completed')
      .map((e) => {
        const ev = e as any;
        let score = 0;
        const reasons: string[] = [];

        // Touring style match (+3)
        if (ev.touring_style && ev.touring_style === current.touring_style) {
          score += 3;
          reasons.push('Style touring sama');
        }

        // Rider level match (+3)
        if (ev.rider_level && current.rider_level) {
          if (ev.rider_level === current.rider_level) {
            score += 3;
            reasons.push('Level rider sama');
          } else if (ev.rider_level === 'all' || current.rider_level === 'all') {
            score += 1;
            reasons.push('Cocok untuk semua level');
          }
        }

        // Motor types overlap (+2 per match)
        const currentMotors: string[] = current.motor_types || [];
        const eventMotors: string[] = ev.motor_types || [];
        const motorOverlap = currentMotors.filter((m: string) => eventMotors.includes(m));
        if (motorOverlap.length > 0) {
          score += motorOverlap.length * 2;
          reasons.push(`Tipe motor cocok (${motorOverlap.length})`);
        }

        // Same category (+2)
        if (e.category === currentEvent.category) {
          score += 2;
          reasons.push('Kategori sama');
        }

        // Same difficulty (+1)
        if (e.difficulty === currentEvent.difficulty) {
          score += 1;
          reasons.push('Tingkat kesulitan sama');
        }

        return { event: e, score, reasons };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [currentEvent, allEvents, limit]);
}
