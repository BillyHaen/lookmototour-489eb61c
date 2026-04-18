import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import HowToShareLocation from './HowToShareLocation';

interface Props {
  onSubmit: (url: string, notes: string) => void;
  loading?: boolean;
}

export default function GoogleMapsLinkForm({ onSubmit, loading }: Props) {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Link Google Maps wajib diisi');
      return;
    }
    if (!/^https?:\/\/(maps\.app\.goo\.gl|www\.google\.com\/maps|goo\.gl\/maps|maps\.google\.com)/i.test(url.trim())) {
      setError('Link harus dari Google Maps (maps.app.goo.gl atau google.com/maps)');
      return;
    }
    setError('');
    onSubmit(url.trim(), notes.trim());
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="gmaps-url" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Link Google Maps Live Location *
            </Label>
            <Input
              id="gmaps-url"
              type="url"
              placeholder="https://maps.app.goo.gl/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              maxLength={500}
              className="mt-1.5"
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            <div className="mt-1"><HowToShareLocation /></div>
          </div>

          <div>
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Misal: Berangkat jam 6 pagi, ETA Bromo 5 sore"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={300}
              className="mt-1.5"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Mulai Tracking
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
