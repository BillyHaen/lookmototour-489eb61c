import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Mountain, User, LogOut, Shield, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import UserAvatar from '@/components/UserAvatar';

const NAV_ITEMS = [
  { label: 'Beranda', path: '/' },
  { label: 'Event', path: '/events' },
  { label: 'Toko', path: '/shop' },
  { label: 'Kalender', path: '/calendar' },
  { label: 'Tentang', path: '/about' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('name, avatar_url').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl">
          <Mountain className="h-7 w-7 text-primary" />
          <span>LookMotoTour</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin" className="gap-2"><Shield className="h-4 w-4" /> Admin</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile" className="gap-2">
                  <UserAvatar src={profile?.avatar_url} name={profile?.name} className="h-6 w-6" />
                  Profil
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-2">
                <LogOut className="h-4 w-4" /> Keluar
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Masuk</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Daftar</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden bg-card border-b border-border animate-fade-in">
          <div className="container py-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                    Admin CMS
                  </Link>
                )}
                <Link to="/profile" onClick={() => setOpen(false)} className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                  Profil
                </Link>
                <Button variant="outline" className="mt-2" onClick={() => { signOut(); setOpen(false); }}>
                  Keluar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="mt-2" asChild>
                  <Link to="/login" onClick={() => setOpen(false)}>Masuk</Link>
                </Button>
                <Button className="mt-1" asChild>
                  <Link to="/register" onClick={() => setOpen(false)}>Daftar</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
