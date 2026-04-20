import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface Props {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  variant?: 'default' | 'destructive';
}

export default function ChecklistEditor({ label, value, onChange, placeholder, variant = 'default' }: Props) {
  const [draft, setDraft] = useState('');
  const items = value || [];

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft('');
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder || 'Tulis lalu Enter / klik +'}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <Button type="button" size="sm" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <Badge key={i} variant={variant === 'destructive' ? 'destructive' : 'secondary'} className="gap-1 pr-1">
            <span>{it}</span>
            <button type="button" onClick={() => remove(i)} className="hover:bg-background/30 rounded-full p-0.5"><X className="h-3 w-3" /></button>
          </Badge>
        ))}
        {!items.length && <span className="text-xs text-muted-foreground">Belum ada item.</span>}
      </div>
    </div>
  );
}
