import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useMyVendor } from '@/hooks/useMyVendor';
import { Loader2, ShoppingBag, Package, ArrowLeft, Menu, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const VENDOR_NAV = [
  { label: 'Produk Saya', path: '/vendor/products', icon: ShoppingBag },
  { label: 'Sewa Gear', path: '/vendor/rentals', icon: Package },
];

function SidebarNav({ vendorName, onNavigate }: { vendorName?: string; onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <>
      <div className="px-2 mb-4">
        <div className="font-heading font-bold text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5" /> Vendor
        </div>
        {vendorName && <p className="text-xs text-muted-foreground mt-1 truncate">{vendorName}</p>}
      </div>
      {VENDOR_NAV.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === item.path || (item.path === '/vendor/products' && location.pathname === '/vendor')
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

export default function VendorLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { data: role, isLoading: roleLoading } = useUserRole();
  const { data: vendor, isLoading: vendorLoading } = useMyVendor();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasVendorAccess = role === 'vendor' || (!!vendor && role !== 'admin');

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
    if (!authLoading && !roleLoading && !vendorLoading && user && role && !hasVendorAccess) {
      navigate('/');
    }
  }, [authLoading, user, role, roleLoading, vendorLoading, hasVendorAccess, navigate]);

  if (authLoading || roleLoading || vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !hasVendorAccess) return null;

  if (hasVendorAccess && !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="font-heading font-bold text-xl">Akun belum terhubung ke vendor</h2>
          <p className="text-sm text-muted-foreground">
            Hubungi admin untuk menghubungkan akun Anda ke profil vendor sebelum mengelola produk & sewa.
          </p>
          <Button asChild variant="outline"><Link to="/">Kembali ke Beranda</Link></Button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
          <span className="font-heading font-bold text-lg">Vendor</span>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col gap-2">
              <SidebarNav vendorName={vendor?.name} onNavigate={() => setSheetOpen(false)} />
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
        <SidebarNav vendorName={vendor?.name} />
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
