import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Loader2, LayoutDashboard, CalendarDays, Users, ShoppingBag, MessageSquare, Settings, ArrowLeft, FileText, BookOpen, Menu, X, Image as ImageIcon, Handshake, Building2, Package, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

const ADMIN_NAV = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Event', path: '/admin/events', icon: CalendarDays },
  { label: 'Blog', path: '/admin/blog', icon: FileText },
  { label: 'Jurnal Trip', path: '/admin/trip-journals', icon: BookOpen },
  { label: 'Pustaka Media', path: '/admin/media', icon: ImageIcon },
  { label: 'User', path: '/admin/users', icon: Users },
  { label: 'Produk', path: '/admin/products', icon: ShoppingBag },
  { label: 'Vendor', path: '/admin/vendors', icon: Building2 },
  { label: 'Sewa Gear', path: '/admin/rentals', icon: Package },
  { label: 'Sponsor', path: '/admin/sponsors', icon: Handshake },
  { label: 'Testimoni', path: '/admin/testimonials', icon: MessageSquare },
  { label: 'Email', path: '/admin/emails', icon: Mail },
  { label: 'Pengaturan', path: '/admin/settings', icon: Settings },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <>
      <div className="font-heading font-bold text-lg mb-4 px-2">Admin CMS</div>
      {ADMIN_NAV.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === item.path
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
      <div className="mt-auto pt-4">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" asChild>
          <Link to="/" onClick={onNavigate}><ArrowLeft className="h-4 w-4" /> Kembali ke Situs</Link>
        </Button>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
    if (!authLoading && !isLoading && user && isAdmin === false) navigate('/');
  }, [authLoading, user, isAdmin, isLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
          <span className="font-heading font-bold text-lg">Admin CMS</span>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col gap-2">
              <SidebarNav onNavigate={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-card border-r border-border p-4 flex flex-col gap-2 sticky top-0 h-screen">
        <SidebarNav />
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
