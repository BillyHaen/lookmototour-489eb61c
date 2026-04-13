import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Loader2, LayoutDashboard, CalendarDays, Users, ShoppingBag, MessageSquare, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ADMIN_NAV = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Event', path: '/admin/events', icon: CalendarDays },
  { label: 'User', path: '/admin/users', icon: Users },
  { label: 'Produk', path: '/admin/products', icon: ShoppingBag },
  { label: 'Testimoni', path: '/admin/testimonials', icon: MessageSquare },
  { label: 'Pengaturan', path: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-card border-r border-border p-4 flex flex-col gap-2 sticky top-0 h-screen">
        <div className="font-heading font-bold text-lg mb-4 px-2">Admin CMS</div>
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.path}
            to={item.path}
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
        <div className="mt-auto">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Kembali ke Situs</Link>
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
