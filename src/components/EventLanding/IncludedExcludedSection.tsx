import { CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  included?: string[];
  excluded?: string[];
}

export default function IncludedExcludedSection({ included, excluded }: Props) {
  const hasIncluded = (included || []).length > 0;
  const hasExcluded = (excluded || []).length > 0;
  if (!hasIncluded && !hasExcluded) return null;

  return (
    <section className="py-12 border-t border-border">
      <h2 className="font-heading font-bold text-2xl md:text-3xl mb-6">What's Included &amp; Excluded</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hasIncluded && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" /> Termasuk
            </h3>
            <ul className="space-y-2">
              {(included || []).map((it, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasExcluded && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
            <h3 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" /> Tidak Termasuk
            </h3>
            <ul className="space-y-2">
              {(excluded || []).map((it, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
