import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Trash2, Zap, Ban, Eye } from 'lucide-react';
import { useSponsorRecommendations } from '@/hooks/useSponsorRecommendations';

const WEIGHT_KEYS = ['weight_relevance', 'weight_behavior', 'weight_priority', 'weight_performance', 'weight_trip_context'] as const;
const WEIGHT_LABELS: Record<string, string> = {
  weight_relevance: 'Relevansi (kategori vs motor)',
  weight_behavior: 'Perilaku (klik/lead/conversion)',
  weight_priority: 'Prioritas (paket + boost)',
  weight_performance: 'Performa (conversion rate 30d)',
  weight_trip_context: 'Konteks Trip',
};

export default function SponsorAIControlPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [useAi, setUseAi] = useState(false);
  const [previewUserId, setPreviewUserId] = useState('');
  const [boostSponsor, setBoostSponsor] = useState('');
  const [boostMul, setBoostMul] = useState('1.5');
  const [boostDays, setBoostDays] = useState('7');
  const [blSponsor, setBlSponsor] = useState('');
  const [blSegment, setBlSegment] = useState('');

  const { data: config } = useQuery({
    queryKey: ['sponsor-ai-config'],
    queryFn: async () => {
      const { data } = await (supabase.from('sponsor_ai_config' as any) as any).select('*').eq('id', 1).maybeSingle();
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (config) {
      const w: Record<string, number> = {};
      WEIGHT_KEYS.forEach((k) => (w[k] = Number(config[k] ?? 1)));
      setWeights(w);
      setUseAi(!!config.use_ai_rerank);
    }
  }, [config]);

  const { data: sponsors } = useQuery({
    queryKey: ['admin-sponsors-list'],
    queryFn: async () => {
      const { data } = await (supabase.from('sponsors' as any) as any).select('id, name').order('name');
      return data as any[];
    },
    enabled: open,
  });

  const { data: boosts } = useQuery({
    queryKey: ['sponsor-boosts'],
    queryFn: async () => {
      const { data } = await (supabase.from('sponsor_boosts' as any) as any).select('*, sponsor:sponsors(name)').order('created_at', { ascending: false });
      return data as any[];
    },
    enabled: open,
  });

  const { data: blacklist } = useQuery({
    queryKey: ['sponsor-blacklist'],
    queryFn: async () => {
      const { data } = await (supabase.from('sponsor_blacklist' as any) as any).select('*, sponsor:sponsors(name)').order('created_at', { ascending: false });
      return data as any[];
    },
    enabled: open,
  });

  const saveWeights = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from('sponsor_ai_config' as any) as any).update({ ...weights, use_ai_rerank: useAi }).eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Bobot disimpan' });
      qc.invalidateQueries({ queryKey: ['sponsor-ai-config'] });
      qc.invalidateQueries({ queryKey: ['sponsor-recommendations'] });
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const addBoost = useMutation({
    mutationFn: async () => {
      if (!boostSponsor) throw new Error('Pilih sponsor');
      const expires_at = new Date(Date.now() + Number(boostDays) * 86400000).toISOString();
      const { error } = await (supabase.from('sponsor_boosts' as any) as any).insert({ sponsor_id: boostSponsor, boost_multiplier: Number(boostMul), expires_at });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Boost ditambahkan' });
      setBoostSponsor(''); setBoostMul('1.5'); setBoostDays('7');
      qc.invalidateQueries({ queryKey: ['sponsor-boosts'] });
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const removeBoost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('sponsor_boosts' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsor-boosts'] }),
  });

  const addBl = useMutation({
    mutationFn: async () => {
      if (!blSponsor || !blSegment.trim()) throw new Error('Lengkapi sponsor & segment');
      const { error } = await (supabase.from('sponsor_blacklist' as any) as any).insert({ sponsor_id: blSponsor, segment: blSegment.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Blacklist ditambahkan' });
      setBlSponsor(''); setBlSegment('');
      qc.invalidateQueries({ queryKey: ['sponsor-blacklist'] });
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const removeBl = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('sponsor_blacklist' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsor-blacklist'] }),
  });

  const { data: preview, isFetching: previewLoading, refetch: refetchPreview } = useSponsorRecommendations({
    targetUserId: previewUserId || undefined,
    enabled: false,
    limit: 10,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: 'hsl(24 95% 53%)' }} />
            AI Recommendation Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="weights">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="weights">Bobot</TabsTrigger>
            <TabsTrigger value="boost">Boost</TabsTrigger>
            <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="weights" className="space-y-4 pt-4">
            {WEIGHT_KEYS.map((k) => (
              <div key={k}>
                <div className="flex justify-between text-sm mb-2">
                  <Label>{WEIGHT_LABELS[k]}</Label>
                  <span className="font-mono">{(weights[k] ?? 1).toFixed(2)}</span>
                </div>
                <Slider min={0} max={5} step={0.1} value={[weights[k] ?? 1]} onValueChange={(v) => setWeights({ ...weights, [k]: v[0] })} />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm pt-2">
              <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} />
              Aktifkan AI re-rank (Lovable AI Gateway, lebih lambat)
            </label>
            <Button onClick={() => saveWeights.mutate()} disabled={saveWeights.isPending} className="w-full">
              {saveWeights.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Simpan Bobot
            </Button>
          </TabsContent>

          <TabsContent value="boost" className="space-y-4 pt-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label>Tambah Boost Manual</Label>
                <Select value={boostSponsor} onValueChange={setBoostSponsor}>
                  <SelectTrigger><SelectValue placeholder="Pilih sponsor" /></SelectTrigger>
                  <SelectContent>{sponsors?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Multiplier</Label>
                    <Input type="number" step="0.1" value={boostMul} onChange={(e) => setBoostMul(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Berlaku (hari)</Label>
                    <Input type="number" value={boostDays} onChange={(e) => setBoostDays(e.target.value)} />
                  </div>
                </div>
                <Button onClick={() => addBoost.mutate()} disabled={addBoost.isPending} className="w-full">
                  <Zap className="h-4 w-4 mr-1" /> Tambah Boost
                </Button>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {boosts?.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{b.sponsor?.name}</p>
                    <p className="text-xs text-muted-foreground">×{b.boost_multiplier} · exp {b.expires_at ? new Date(b.expires_at).toLocaleDateString() : 'never'}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeBoost.mutate(b.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              {!boosts?.length && <p className="text-sm text-muted-foreground text-center py-4">Belum ada boost aktif.</p>}
            </div>
          </TabsContent>

          <TabsContent value="blacklist" className="space-y-4 pt-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label>Sembunyikan untuk segment</Label>
                <Select value={blSponsor} onValueChange={setBlSponsor}>
                  <SelectTrigger><SelectValue placeholder="Pilih sponsor" /></SelectTrigger>
                  <SelectContent>{sponsors?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <div>
                  <Label className="text-xs">Segment (mis: motor_type:sport, category:adventure)</Label>
                  <Input value={blSegment} onChange={(e) => setBlSegment(e.target.value)} placeholder="motor_type:sport" />
                </div>
                <Button onClick={() => addBl.mutate()} disabled={addBl.isPending} className="w-full">
                  <Ban className="h-4 w-4 mr-1" /> Tambah Blacklist
                </Button>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {blacklist?.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{b.sponsor?.name}</p>
                    <Badge variant="outline" className="text-xs mt-1">{b.segment}</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeBl.mutate(b.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              {!blacklist?.length && <p className="text-sm text-muted-foreground text-center py-4">Belum ada blacklist.</p>}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input placeholder="User ID untuk preview" value={previewUserId} onChange={(e) => setPreviewUserId(e.target.value)} />
              <Button onClick={() => refetchPreview()} disabled={!previewUserId || previewLoading}>
                {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="space-y-2">
              {preview?.map((r, i) => (
                <div key={r.sponsor.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{i + 1}. {r.sponsor.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      score={r.score} · rel={r.reason.relevance?.toFixed(2)} beh={r.reason.behavior?.toFixed(2)} pri={r.reason.priority?.toFixed(2)} perf={r.reason.performance?.toFixed(2)} trip={r.reason.trip_context}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">{r.sponsor.category}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
