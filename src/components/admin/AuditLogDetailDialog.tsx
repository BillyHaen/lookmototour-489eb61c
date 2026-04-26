import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AuditLog } from '@/hooks/useAuditLogs';

interface Props {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function JsonBlock({ data }: { data: any }) {
  if (data == null) return <div className="text-xs text-muted-foreground italic">—</div>;
  return (
    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-[40vh] whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export function AuditLogDetailDialog({ log, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Detail Audit Log</DialogTitle>
          <DialogDescription>
            {log ? new Date(log.created_at).toLocaleString('id-ID') : ''}
          </DialogDescription>
        </DialogHeader>

        {log && (
          <ScrollArea className="max-h-[70vh] pr-3">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="User" value={log.user_name || '—'} />
                <Field label="Email" value={log.user_email || '—'} />
                <Field label="User ID" value={log.user_id || '—'} mono />
                <Field label="Aksi" value={<Badge>{log.action}</Badge>} />
                <Field label="Tabel" value={log.table_name || '—'} />
                <Field label="Record ID" value={log.record_id || '—'} mono />
                <Field label="Status" value={<Badge variant={log.status === 'success' ? 'default' : 'destructive'}>{log.status}</Badge>} />
                <Field label="IP Address" value={log.ip_address || '—'} mono />
                <div className="col-span-2">
                  <Field label="User Agent" value={log.user_agent || '—'} mono />
                </div>
                {log.error_message && (
                  <div className="col-span-2">
                    <Field label="Error" value={<span className="text-destructive">{log.error_message}</span>} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-semibold mb-1">Sebelum (old)</div>
                  <JsonBlock data={log.old_values} />
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1">Sesudah (new)</div>
                  <JsonBlock data={log.new_values} />
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-1">Metadata</div>
                <JsonBlock data={log.metadata} />
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono break-all' : ''}`}>{value}</div>
    </div>
  );
}
