import { useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { useAuditLogs, type AuditLog } from '@/hooks/useAuditLogs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, ShieldCheck, RotateCcw } from 'lucide-react';
import { AuditLogDetailDialog } from '@/components/admin/AuditLogDetailDialog';
import DataPagination, { DEFAULT_PAGE_SIZE } from '@/components/admin/DataPagination';

const ACTIONS = ['create', 'update', 'delete', 'login', 'logout', 'login_failed', 'signup', 'password_reset'];
const TABLES = [
  'events', 'products', 'event_registrations', 'gear_rentals', 'vendors',
  'sponsors', 'blog_posts', 'site_settings', 'email_template_overrides',
  'user_roles', 'profiles',
];

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const TODAY = todayISO();

function actionVariant(a: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (a === 'delete' || a === 'login_failed') return 'destructive';
  if (a === 'create' || a === 'signup') return 'default';
  if (a === 'login' || a === 'logout') return 'secondary';
  return 'outline';
}

export default function AdminAuditLogs() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [tableName, setTableName] = useState('all');
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState(TODAY);
  const [endDate, setEndDate] = useState(TODAY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const filters = useMemo(() => ({
    search: search.trim() || undefined,
    action,
    tableName,
    status,
    startDate: startDate ? new Date(startDate + 'T00:00:00').toISOString() : undefined,
    endDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
    page,
    pageSize,
  }), [search, action, tableName, status, startDate, endDate, page, pageSize]);

  const { data, isLoading } = useAuditLogs(filters);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  const resetFilters = () => {
    setSearch('');
    setAction('all');
    setTableName('all');
    setStatus('all');
    setStartDate(TODAY);
    setEndDate(TODAY);
    setPage(1);
  };

  const exportCsv = () => {
    if (!rows.length) return;
    const headers = ['Waktu', 'User', 'Email', 'Aksi', 'Tabel', 'Record ID', 'Status', 'IP', 'User Agent', 'Error'];
    const lines = [headers.join(',')];
    for (const r of rows) {
      const cols = [
        new Date(r.created_at).toISOString(),
        r.user_name ?? '',
        r.user_email ?? '',
        r.action,
        r.table_name ?? '',
        r.record_id ?? '',
        r.status,
        r.ip_address ?? '',
        r.user_agent ?? '',
        r.error_message ?? '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(cols.join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" /> Audit Trail
            </h1>
            <p className="text-sm text-muted-foreground">
              Catatan kronologis semua aktivitas penting (read-only, tidak bisa diubah/dihapus).
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" /> Reset Filter
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
              <Download className="h-4 w-4" /> Ekspor CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 p-3 bg-card rounded-lg border">
          <Input
            placeholder="Cari user/email/record id"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="md:col-span-2"
          />
          <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Aksi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tableName} onValueChange={(v) => { setTableName(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Tabel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tabel</SelectItem>
              {TABLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="success">success</SelectItem>
              <SelectItem value="failed">failed</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
          <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Tidak ada catatan untuk filter ini. Coba reset filter atau perluas rentang tanggal.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Tabel</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{r.user_name || '—'}</div>
                      <div className="text-muted-foreground">{r.user_email || '—'}</div>
                    </TableCell>
                    <TableCell><Badge variant={actionVariant(r.action)}>{r.action}</Badge></TableCell>
                    <TableCell className="text-xs">{r.table_name || '—'}</TableCell>
                    <TableCell className="text-xs font-mono max-w-[140px] truncate">{r.record_id || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'success' ? 'default' : 'destructive'}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{r.ip_address || '—'}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setDetail(r)}>Detail</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DataPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <AuditLogDetailDialog log={detail} open={!!detail} onOpenChange={(v) => !v && setDetail(null)} />
    </AdminLayout>
  );
}
