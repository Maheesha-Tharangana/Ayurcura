import React from 'react';
import { Link } from 'wouter';
import { User, LogIn, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { 
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger 
} from '@/components/ui/sheet';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">AyurCure</span>
            </a>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/doctors">
              <a className="text-sm font-medium hover:text-primary">Doctors</a>
            </Link>
            <Link href="/treatments">
              <a className="text-sm font-medium hover:text-primary">Treatments</a>
            </Link>
            <Link href="/articles">
              <a className="text-sm font-medium hover:text-primary">Articles</a>
            </Link>
            <Link href="/symptom-analysis">
              <a className="text-sm font-medium hover:text-primary">Symptom Analysis</a>
            </Link>
          </nav>
          
          {/* User Account */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/appointments">
                  <a className="text-sm font-medium hover:text-primary">Appointments</a>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <a className="text-sm font-medium hover:text-primary">Admin</a>
                  </Link>
                )}
                <Link href="/profile">
                  <a>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User size={16} />
                      {user.username}
                    </Button>
                  </a>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => logout()}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <a>
                  <Button variant="default" size="sm" className="gap-2">
                    <LogIn size={16} />
                    Sign In
                  </Button>
                </a>
              </Link>
            )}
          </div>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>AyurCure</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col py-6 space-y-4">
                <SheetClose asChild>
                  <Link href="/">
                    <a className="text-base font-medium hover:text-primary py-2">Home</a>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/doctors">
                    <a className="text-base font-medium hover:text-primary py-2">Doctors</a>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/treatments">
                    <a className="text-base font-medium hover:text-primary py-2">Treatments</a>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/articles">
                    <a className="text-base font-medium hover:text-primary py-2">Articles</a>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/symptom-analysis">
                    <a className="text-base font-medium hover:text-primary py-2">Symptom Analysis</a>
                  </Link>
                </SheetClose>
                
                {user ? (
                  <>
                    <SheetClose asChild>
                      <Link href="/appointments">
                        <a className="text-base font-medium hover:text-primary py-2">Appointments</a>
                      </Link>
                    </SheetClose>
                    {user.role === 'admin' && (
                      <SheetClose asChild>
                        <Link href="/admin">
                          <a className="text-base font-medium hover:text-primary py-2">Admin Dashboard</a>
                        </Link>
                      </SheetClose>
                    )}
                    <SheetClose asChild>
                      <Link href="/profile">
                        <a className="text-base font-medium hover:text-primary py-2">My Profile</a>
                      </Link>
                    </SheetClose>
                    <Button 
                      onClick={() => logout()}
                      className="mt-2"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <SheetClose asChild>
                    <Link href="/auth">
                      <a>
                        <Button className="w-full">
                          Sign In
                        </Button>
                      </a>
                    </Link>
                  </SheetClose>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 bg-neutral-50">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">AyurCure Medical</h3>
              <p className="text-sm text-muted-foreground">
                Your trusted platform for Ayurvedic healthcare services,
                connecting patients with qualified practitioners.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/doctors">
                    <a className="text-sm text-muted-foreground hover:text-primary">Find Doctors</a>
                  </Link>
                </li>
                <li>
                  <Link href="/treatments">
                    <a className="text-sm text-muted-foreground hover:text-primary">Treatments</a>
                  </Link>
                </li>
                <li>
                  <Link href="/articles">
                    <a className="text-sm text-muted-foreground hover:text-primary">Articles</a>
                  </Link>
                </li>
                <li>
                  <Link href="/symptom-analysis">
                    <a className="text-sm text-muted-foreground hover:text-primary">Symptom Analysis</a>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Email: contact@ayurcure.com</li>
                <li>Phone: +1 (555) 123-4567</li>
                <li>Address: 123 Ayurveda Way, Wellness City</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200 mt-8 pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AyurCure Medical. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}