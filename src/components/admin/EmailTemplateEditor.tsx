import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, RotateCcw, Eye, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EmailTemplateMeta } from '@/lib/emailTemplateRegistry';
import { EmailTestDialog } from './EmailTestDialog';

interface Props {
  template: EmailTemplateMeta;
}

export function EmailTemplateEditor({ template }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);

  const { data: override, isLoading } = useQuery({
    queryKey: ['email-override', template.name],
    queryFn: async () => {
      const { data } = await supabase
        .from('email_template_overrides')
        .select('*')
        .eq('template_name', template.name)
        .maybeSingle();
      return data;
    },
  });

  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Sync state when template/override changes
  if (!isLoading && !initialized) {
    setSubject(override?.subject || template.defaultSubject);
    setBodyHtml(override?.body_html || defaultBoilerplate(template));
    setIsActive(override?.is_active ?? true);
    setInitialized(true);
  }

  // Re-init when template name changes
  if (initialized && override !== undefined) {
    // noop — handled by parent re-mount via key prop
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('email_template_overrides')
        .upsert(
          {
            template_name: template.name,
            subject,
            body_html: bodyHtml,
            is_active: isActive,
            updated_by: user?.id,
          },
          { onConflict: 'template_name' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Tersimpan', description: 'Override template berhasil disimpan.' });
      qc.invalidateQueries({ queryKey: ['email-override', template.name] });
      qc.invalidateQueries({ queryKey: ['email-overrides-all'] });
    },
    onError: (e: any) => toast({ title: 'Gagal menyimpan', description: e.message, variant: 'destructive' }),
  });

  const resetMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('email_template_overrides')
        .delete()
        .eq('template_name', template.name);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Direset', description: 'Template kembali ke versi default.' });
      setSubject(template.defaultSubject);
      setBodyHtml(defaultBoilerplate(template));
      setIsActive(true);
      qc.invalidateQueries({ queryKey: ['email-override', template.name] });
      qc.invalidateQueries({ queryKey: ['email-overrides-all'] });
    },
    onError: (e: any) => toast({ title: 'Gagal reset', description: e.message, variant: 'destructive' }),
  });

  const insertVariable = (varName: string) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const placeholder = `{{${varName}}}`;
    const next = bodyHtml.slice(0, start) + placeholder + bodyHtml.slice(end);
    setBodyHtml(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  const handlePreview = () => {
    let html = bodyHtml;
    Object.entries(template.sampleData).forEach(([k, v]) => {
      html = html.split(`{{${k}}}`).join(String(v));
    });
    setPreviewHtml(html);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold">{template.displayName}</h2>
            <Badge variant={template.category === 'auth' ? 'secondary' : 'outline'}>
              {template.category === 'auth' ? 'Auth' : 'Transactional'}
            </Badge>
            {override && <Badge>Custom</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{template.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Template name: <code className="px-1 py-0.5 bg-muted rounded">{template.name}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="active-toggle" className="text-sm">Override aktif</Label>
          <Switch id="active-toggle" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Subject</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject email..." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
        <div className="space-y-2">
          <Label>Body (HTML)</Label>
          <Textarea
            ref={bodyRef}
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            className="font-mono text-xs min-h-[400px]"
            placeholder="<html>...</html>"
          />
        </div>
        <div className="space-y-2">
          <Label>Variabel tersedia</Label>
          <div className="flex flex-wrap gap-1.5 p-3 bg-muted/50 rounded-lg border max-h-[400px] overflow-y-auto">
            {template.variables.map((v) => (
              <button
                key={v}
                onClick={() => insertVariable(v)}
                className="text-xs px-2 py-1 bg-background border rounded hover:bg-accent transition-colors"
                type="button"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Klik variabel untuk insert ke body.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan
        </Button>
        <Button variant="outline" onClick={handlePreview}>
          <Eye className="h-4 w-4" /> Preview
        </Button>
        <Button variant="outline" onClick={() => setTestOpen(true)}>
          <Send className="h-4 w-4" /> Kirim Test
        </Button>
        {override && (
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('Reset ke template default? Override akan dihapus.')) resetMut.mutate();
            }}
            disabled={resetMut.isPending}
          >
            <RotateCcw className="h-4 w-4" /> Reset ke Default
          </Button>
        )}
      </div>

      {previewHtml && (
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="px-3 py-2 bg-muted text-xs flex items-center justify-between">
            <span>Preview (sample data)</span>
            <button onClick={() => setPreviewHtml(null)} className="text-muted-foreground hover:text-foreground">×</button>
          </div>
          <iframe srcDoc={previewHtml} className="w-full h-[600px] bg-white" title="Email preview" />
        </div>
      )}

      <EmailTestDialog
        open={testOpen}
        onOpenChange={setTestOpen}
        templateName={template.name}
        defaultSampleData={template.sampleData}
      />
    </div>
  );
}

function defaultBoilerplate(t: EmailTemplateMeta): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${t.displayName}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Montserrat',Arial,sans-serif;color:hsl(220,10%,30%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:24px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;padding:20px 25px;">
        <tr><td>
          <img src="https://efrwzkdfkfvedtdrxrfg.supabase.co/storage/v1/object/public/email-assets/logo.png" alt="LookMotoTour" height="40" style="margin-bottom:24px;" />
          <h1 style="font-size:22px;color:hsl(220,25%,10%);margin:0 0 16px;">Halo {{name}},</h1>
          <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">
            Edit template ini sesuai kebutuhan. Gunakan placeholder seperti <code>{{name}}</code> untuk menyisipkan data dinamis.
          </p>
          <p style="font-size:12px;color:hsl(220,10%,50%);text-align:center;margin-top:32px;">
            © LookMotoTour
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
