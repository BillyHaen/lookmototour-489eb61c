import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templateName: string;
  defaultSampleData: Record<string, any>;
}

export function EmailTestDialog({ open, onOpenChange, templateName, defaultSampleData }: Props) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [sampleJson, setSampleJson] = useState(JSON.stringify(defaultSampleData, null, 2));
  const [sending, setSending] = useState(false);

  // Reset form when template changes
  const [lastTemplate, setLastTemplate] = useState(templateName);
  if (lastTemplate !== templateName) {
    setLastTemplate(templateName);
    setSampleJson(JSON.stringify(defaultSampleData, null, 2));
  }

  const send = async () => {
    if (!email) {
      toast({ title: 'Email kosong', description: 'Masukkan alamat email tujuan.', variant: 'destructive' });
      return;
    }
    let sampleData: Record<string, any>;
    try {
      sampleData = JSON.parse(sampleJson);
    } catch {
      toast({ title: 'JSON tidak valid', description: 'Periksa format sample data.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: { templateName, recipientEmail: email, sampleData },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({
        title: 'Email test terkirim',
        description: `Diantrekan ke ${email}. Cek inbox dalam ~1 menit. ${(data as any)?.used_override ? '(versi custom)' : '(versi default)'}`,
      });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Gagal mengirim', description: e.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Kirim Test Email</DialogTitle>
          <DialogDescription>
            Template: <code className="px-1 py-0.5 bg-muted rounded text-xs">{templateName}</code>
            <br />Subject akan diawali <code className="px-1 py-0.5 bg-muted rounded text-xs">[TEST]</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Email tujuan</Label>
            <Input
              type="email"
              placeholder="kamu@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Sample data (JSON)</Label>
            <Textarea
              value={sampleJson}
              onChange={(e) => setSampleJson(e.target.value)}
              className="font-mono text-xs min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">Nilai ini akan menggantikan placeholder di template.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>Batal</Button>
          <Button onClick={send} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Kirim Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
