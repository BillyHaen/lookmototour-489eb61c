import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Loader2, RotateCcw, Save, X } from 'lucide-react';

interface Props {
  userId: string;
}

interface ProfileOverride {
  override_total_trips: number | null;
  override_total_km: number | null;
  override_trust_score: number | null;
  total_trips: number;
  total_km: number;
  trust_score: number;
}

export default function RiderOverridePanel({ userId }: Props) {
  const queryClient = useQueryClient();
  const [trips, setTrips] = useState<string>('');
  const [km, setKm] = useState<string>('');
  const [trustScore, setTrustScore] = useState<string>('');
  const [selectedAchievements, setSelectedAchievements] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['admin-profile-override', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('override_total_trips, override_total_km, override_trust_score, total_trips, total_km, trust_score')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as ProfileOverride;
    },
  });

  const { data: achievements } = useQuery({
    queryKey: ['achievements-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('achievements').select('*').order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: userAchievements, refetch: refetchUserAch } = useQuery({
    queryKey: ['admin-user-achievements', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_code')
        .eq('user_id', userId);
      if (error) throw error;
      return (data || []).map((r: any) => r.achievement_code as string);
    },
  });

  useEffect(() => {
    if (profile) {
      setTrips(profile.override_total_trips != null ? String(profile.override_total_trips) : '');
      setKm(profile.override_total_km != null ? String(profile.override_total_km) : '');
      setTrustScore(profile.override_trust_score != null ? String(profile.override_trust_score) : '');
    }
  }, [profile]);

  useEffect(() => {
    setSelectedAchievements(new Set());
  }, [userId]);

  const toggleAch = (code: string) => {
    setSelectedAchievements(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const parsed = {
      _user_id: userId,
      _trips: trips === '' ? null : Number(trips),
      _km: km === '' ? null : Number(km),
      _trust_score: trustScore === '' ? null : Number(trustScore),
      _achievement_codes: Array.from(selectedAchievements),
    };
    const { error } = await supabase.rpc('admin_set_rider_overrides', parsed as any);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Override disimpan ✅' });
    setSelectedAchievements(new Set());
    queryClient.invalidateQueries({ queryKey: ['admin-profile-override', userId] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-achievements', userId] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
  };

  const handleReset = async () => {
    setSaving(true);
    const { error } = await supabase.rpc('admin_set_rider_overrides', {
      _user_id: userId,
      _trips: null,
      _km: null,
      _trust_score: null,
      _achievement_codes: [],
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Override direset ke otomatis ✅' });
    queryClient.invalidateQueries({ queryKey: ['admin-profile-override', userId] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
    queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
  };

  const handleRevoke = async (code: string) => {
    const { error } = await supabase.rpc('admin_revoke_achievement', { _user_id: userId, _code: code } as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Badge dicabut ✅' });
    refetchUserAch();
  };

  if (loadingProfile) {
    return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  const isOverriddenTrips = profile?.override_total_trips != null;
  const isOverriddenKm = profile?.override_total_km != null;
  const isOverriddenTrust = profile?.override_trust_score != null;

  return (
    <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Override Rider Stats (Admin)</h4>
        <Badge variant="outline" className="text-[10px]">Hanya Admin</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs flex items-center gap-1">
            Jumlah Trip {isOverriddenTrips && <Badge variant="default" className="text-[9px] px-1 py-0">Manual</Badge>}
          </Label>
          <Input type="number" min="0" placeholder="Auto" value={trips} onChange={e => setTrips(e.target.value)} className="h-9" />
        </div>
        <div>
          <Label className="text-xs flex items-center gap-1">
            Total KM {isOverriddenKm && <Badge variant="default" className="text-[9px] px-1 py-0">Manual</Badge>}
          </Label>
          <Input type="number" min="0" step="0.1" placeholder="Auto" value={km} onChange={e => setKm(e.target.value)} className="h-9" />
        </div>
        <div>
          <Label className="text-xs flex items-center gap-1">
            Trust Score {isOverriddenTrust && <Badge variant="default" className="text-[9px] px-1 py-0">Manual</Badge>}
          </Label>
          <Input type="number" min="0" placeholder="Auto" value={trustScore} onChange={e => setTrustScore(e.target.value)} className="h-9" />
          <p className="text-[10px] text-muted-foreground mt-0.5">0-99 New, 100-299 Trusted, 300+ Pro</p>
        </div>
      </div>

      <div>
        <Label className="text-xs mb-2 block">Berikan Badge Manual</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
          {achievements?.map((a: any) => {
            const owned = userAchievements?.includes(a.code);
            return (
              <label key={a.code} className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                <Checkbox
                  checked={selectedAchievements.has(a.code)}
                  onCheckedChange={() => toggleAch(a.code)}
                  disabled={owned}
                />
                <span className={owned ? 'text-muted-foreground line-through' : ''}>
                  {a.name} {owned && '(sudah dimiliki)'}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {!!userAchievements?.length && (
        <div>
          <Label className="text-xs mb-2 block">Badge Aktif</Label>
          <div className="flex flex-wrap gap-1.5">
            {userAchievements.map(code => {
              const a = achievements?.find((x: any) => x.code === code);
              return (
                <Badge key={code} variant="secondary" className="gap-1 pr-1 text-xs">
                  {a?.name || code}
                  <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-destructive/20" onClick={() => handleRevoke(code)}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Simpan Override
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset} disabled={saving} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset ke Otomatis
        </Button>
      </div>
    </div>
  );
}
