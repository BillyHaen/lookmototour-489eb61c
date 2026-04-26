import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet } from 'lucide-react';

interface Props {
  mode: 'none' | 'fixed' | 'percent';
  value: number;
  expiryDays: number | null;
  onChange: (next: { mode: 'none' | 'fixed' | 'percent'; value: number; expiryDays: number | null }) => void;
}

export default function CreditRewardConfig({ mode, value, expiryDays, onChange }: Props) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">Reward Kredit</Label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Mode</Label>
          <Select value={mode} onValueChange={(v) => onChange({ mode: v as any, value, expiryDays })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tanpa Kredit</SelectItem>
              <SelectItem value="fixed">Nominal Tetap (Rp)</SelectItem>
              <SelectItem value="percent">Persen dari Harga</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {mode !== 'none' && (
          <div>
            <Label className="text-xs">{mode === 'fixed' ? 'Nilai (Rp)' : 'Persen (%)'}</Label>
            <Input type="number" min={0} step={mode === 'percent' ? 0.5 : 1000}
              value={value || 0}
              onChange={(e) => onChange({ mode, value: Number(e.target.value), expiryDays })} />
          </div>
        )}
      </div>
      {mode !== 'none' && (
        <div>
          <Label className="text-xs">Masa berlaku kredit (hari) — kosongkan untuk pakai default global</Label>
          <Input type="number" min={1} placeholder="Default 365"
            value={expiryDays ?? ''}
            onChange={(e) => onChange({ mode, value, expiryDays: e.target.value ? Number(e.target.value) : null })} />
        </div>
      )}
    </div>
  );
}
