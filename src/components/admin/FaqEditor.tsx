import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export interface FaqItem {
  question: string;
  answer: string;
}

interface Props {
  value: FaqItem[];
  onChange: (v: FaqItem[]) => void;
}

export default function FaqEditor({ value, onChange }: Props) {
  const items = value || [];

  const update = (i: number, patch: Partial<FaqItem>) => {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };
  const add = () => onChange([...items, { question: '', answer: '' }]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">FAQ #{i + 1}</span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowDown className="h-3 w-3" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
          <Input placeholder="Pertanyaan (mis: Apakah tour ini cocok untuk pemula?)" value={it.question} onChange={(e) => update(i, { question: e.target.value })} />
          <Textarea placeholder="Jawaban..." rows={3} value={it.answer} onChange={(e) => update(i, { answer: e.target.value })} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-2"><Plus className="h-4 w-4" /> Tambah FAQ</Button>
      {!items.length && <p className="text-sm text-muted-foreground text-center py-4">Belum ada FAQ.</p>}
    </div>
  );
}
