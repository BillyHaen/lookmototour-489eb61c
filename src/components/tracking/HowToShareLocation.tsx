import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

export default function HowToShareLocation() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="link" size="sm" className="gap-1 px-0 h-auto">
          <HelpCircle className="h-4 w-4" /> Cara dapat link Google Maps Live Location
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📍 Cara Share Live Location dari Google Maps</DialogTitle>
        </DialogHeader>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
            <span>Buka aplikasi <strong>Google Maps</strong> di HP.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
            <span>Tap foto profil di kanan atas → pilih <strong>"Berbagi lokasi"</strong> atau <strong>"Location sharing"</strong>.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
            <span>Tap <strong>"Bagikan lokasi baru"</strong>, atur durasi (rekomendasi: hingga matikan), pilih <strong>"Salin ke papan klip"</strong>.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
            <span>Paste link tersebut ke form di atas.</span>
          </li>
        </ol>
        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          💡 Pastikan GPS HP aktif selama touring agar lokasi tetap update real-time bagi keluarga.
        </div>
      </DialogContent>
    </Dialog>
  );
}
