import { useState } from 'react';
import AdminLayout from './AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EMAIL_TEMPLATES, type EmailTemplateMeta } from '@/lib/emailTemplateRegistry';
import { EmailTemplateEditor } from '@/components/admin/EmailTemplateEditor';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Shield, Zap } from 'lucide-react';

export default function AdminEmails() {
  const [selected, setSelected] = useState<EmailTemplateMeta>(EMAIL_TEMPLATES[0]);

  const { data: overrides = [] } = useQuery({
    queryKey: ['email-overrides-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('email_template_overrides')
        .select('template_name, is_active');
      return data || [];
    },
  });

  const overrideMap = new Map(overrides.map((o) => [o.template_name, o.is_active]));

  const authTemplates = EMAIL_TEMPLATES.filter((t) => t.category === 'auth');
  const transactionalTemplates = EMAIL_TEMPLATES.filter((t) => t.category === 'transactional');

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6" />
          <h1 className="text-2xl font-heading font-bold">Template Email</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Edit subject & body untuk setiap template email. Template dengan badge <Badge variant="default" className="mx-1">Custom</Badge>
          sudah punya override aktif. Klik <strong>Reset ke Default</strong> untuk kembali ke template asli.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <ScrollArea className="h-[calc(100vh-250px)] min-h-[500px]">
              <div className="p-3 space-y-4">
                <TemplateGroup
                  icon={<Shield className="h-4 w-4" />}
                  label="Auth Emails"
                  templates={authTemplates}
                  selected={selected}
                  onSelect={setSelected}
                  overrideMap={overrideMap}
                />
                <TemplateGroup
                  icon={<Zap className="h-4 w-4" />}
                  label="Transactional Emails"
                  templates={transactionalTemplates}
                  selected={selected}
                  onSelect={setSelected}
                  overrideMap={overrideMap}
                />
              </div>
            </ScrollArea>
          </div>

          <div className="bg-card border rounded-lg p-5">
            <EmailTemplateEditor key={selected.name} template={selected} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function TemplateGroup({
  icon,
  label,
  templates,
  selected,
  onSelect,
  overrideMap,
}: {
  icon: React.ReactNode;
  label: string;
  templates: EmailTemplateMeta[];
  selected: EmailTemplateMeta;
  onSelect: (t: EmailTemplateMeta) => void;
  overrideMap: Map<string, boolean>;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="space-y-1">
        {templates.map((t) => {
          const isActive = selected.name === t.name;
          const hasOverride = overrideMap.has(t.name);
          const overrideActive = overrideMap.get(t.name);
          return (
            <button
              key={t.name}
              onClick={() => onSelect(t)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium truncate">{t.displayName}</span>
                {hasOverride && (
                  <Badge
                    variant={isActive ? 'secondary' : overrideActive ? 'default' : 'outline'}
                    className="text-[10px] h-5 shrink-0"
                  >
                    {overrideActive ? 'Custom' : 'Off'}
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
