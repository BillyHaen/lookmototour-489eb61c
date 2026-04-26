import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SponsorBenefitCard from '@/components/SponsorBenefitCard';
import { useAuth } from '@/hooks/useAuth';
import { useUserSponsorDeals } from '@/hooks/useSponsors';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Loader2, Gift } from 'lucide-react';

export default function SponsorDeals() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: deals, isLoading } = useUserSponsorDeals();
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const handleClaim = async (benefitId: string, eventId?: string) => {
    setClaiming(benefitId);
    const { data, error } = await supabase.rpc('claim_sponsor_benefit' as any, {
      _benefit_id: benefitId,
      _event_id: eventId ?? null,
    });
    setClaiming(null);
    if (error) {
      toast({ title: 'Gagal klaim', description: error.message, variant: 'destructive' });
      return;
    }
    const code = (data as any)?.[0]?.claim_code;
    toast({ title: 'Berhasil! 🎉', description: code ? `Kode klaim: ${code}` : 'Benefit diklaim' });
    qc.invalidateQueries({ queryKey: ['user-sponsor-deals'] });
  };

  if (authLoading || isLoading) {
    return <div className="min-h-screen"><Navbar /><div className="pt-24 flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div><Footer /></div>;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 container py-8">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-2xl md:text-3xl mb-2 flex items-center gap-2">
            <Gift className="h-7 w-7" style={{ color: 'hsl(24 95% 53%)' }} />
            Sponsor Deals untuk Trip Anda
          </h1>
          <p className="text-muted-foreground">Penawaran eksklusif dari sponsor untuk peserta trip yang sudah terdaftar.</p>
        </div>

        {!deals?.length ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Belum ada penawaran sponsor untuk trip Anda saat ini.</p>
            <Link to="/events" className="text-primary hover:underline">Lihat event tersedia</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((d: any) => (
              <div key={d.id}>
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  {d.sponsor?.logo_url && <img src={d.sponsor.logo_url} alt="" className="h-5 w-5 object-contain" />}
                  <Link to={`/sponsor/${d.sponsor?.slug}`} className="hover:underline font-medium">{d.sponsor?.name}</Link>
                  {d.linked_event && <span>• {d.linked_event.title}</span>}
                </div>
                <SponsorBenefitCard
                  benefit={d}
                  onClaim={() => handleClaim(d.id, d.linked_event?.id)}
                  claimCode={d.claim?.claim_code}
                  loading={claiming === d.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
