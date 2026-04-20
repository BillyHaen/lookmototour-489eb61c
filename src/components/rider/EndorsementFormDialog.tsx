import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { useCreateEndorsement } from '@/hooks/useEndorsements';

export default function EndorsementFormDialog({ open, onOpenChange, toUserId, toName }: {
  open: boolean; onOpenChange: (b: boolean) => void; toUserId: string; toName: string;
}) {
  const create = useCreateEndorsement(toUserId);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');

  const submit = async () => {
    await create.mutateAsync({ rating, content });
    setContent(''); setRating(5);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Endorse {toName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Rating</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                  <Star className={`h-6 w-6 ${n <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Testimoni</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Pengalaman riding bareng..." rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit} disabled={create.isPending || content.trim().length < 5}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Kirim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
