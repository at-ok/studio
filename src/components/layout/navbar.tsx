"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, PlusSquare, User, LogIn, LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/common/logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';

const navItems = [
  { name: 'Discover', href: '/discover', icon: Compass, 'aria-label': 'Discover routes' },
  { name: 'Create', href: '/create', icon: PlusSquare, 'aria-label': 'Create a new route' },
  { name: 'My Page', href: '/my-page', icon: User, 'aria-label': 'View your page' },
];

// Mock authentication state
// In a real app, this would come from an auth context/hook
const useMockAuth = () => {
  const [user, setUser] = useState<{ name: string; email: string; imageUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user data
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);


  const login = () => {
    const mockUserData = { name: 'User Name', email: 'user@example.com', imageUrl: 'https://picsum.photos/100/100?q=user' };
    localStorage.setItem('mockUser', JSON.stringify(mockUserData));
    setUser(mockUserData);
  };
  const logout = () => {
    localStorage.removeItem('mockUser');
    setUser(null);
  };
  
  return { user, loading, login, logout };
};


export function Navbar() {
  const pathname = usePathname();
  const { user, loading, login, logout } = useMockAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const NavLink = ({ href, children, icon: Icon, 'aria-label': ariaLabel }: { href: string; children: React.ReactNode; icon: React.ElementType; 'aria-label': string }) => (
    <Link href={href} passHref legacyBehavior>
      <a
        aria-label={ariaLabel}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/10 hover:text-accent-foreground",
          pathname === href ? "bg-primary/10 text-primary font-semibold" : "text-foreground/70 hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        {children}
      </a>
    </Link>
  );
  
  const MobileNavLink = ({ href, children, icon: Icon, 'aria-label': ariaLabel }: { href: string; children: React.ReactNode; icon: React.ElementType; 'aria-label': string }) => (
    <Link href={href} passHref legacyBehavior>
      <a
        aria-label={ariaLabel}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-accent/10 hover:text-accent-foreground",
          pathname === href ? "bg-primary/10 text-primary font-semibold" : "text-foreground/80 hover:text-foreground"
        )}
      >
        <Icon className="h-6 w-6" />
        {children}
      </a>
    </Link>
  );


  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.name} href={item.href} icon={item.icon} aria-label={item['aria-label']}>
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    <AvatarImage src={user.imageUrl || `https://ui-avatars.com/api/?name=${user.name}&background=4CAF50&color=fff`} alt={user.name} data-ai-hint="user avatar" />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my-page" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" /> My Page
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer flex items-center gap-2">
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <Button onClick={login} variant="outline" className="hidden md:flex items-center gap-2 border-primary text-primary hover:bg-primary/10 hover:text-primary">
              <LogIn className="h-4 w-4" /> Sign In
            </Button>
          )}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open mobile menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs bg-background p-6">
                <div className="mb-6">
                  <Logo size="sm"/>
                </div>
                <nav className="flex flex-col gap-3">
                  {navItems.map((item) => (
                    <MobileNavLink key={item.name} href={item.href} icon={item.icon} aria-label={item['aria-label']}>
                      {item.name}
                    </MobileNavLink>
                  ))}
                   <hr className="my-3 border-border" />
                  {user ? (
                    <>
                       <div className="px-4 py-2">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                       <Button onClick={() => { logout(); setIsMobileMenuOpen(false); }} variant="ghost" className="w-full justify-start flex items-center gap-3 text-base font-medium text-destructive hover:bg-destructive/10 hover:text-destructive px-4 py-3">
                        <LogOut className="h-6 w-6" /> Log out
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => { login(); setIsMobileMenuOpen(false); }} variant="outline" className="w-full justify-start flex items-center gap-3 text-base font-medium border-primary text-primary hover:bg-primary/10 hover:text-primary px-4 py-3">
                      <LogIn className="h-6 w-6" /> Sign In
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
