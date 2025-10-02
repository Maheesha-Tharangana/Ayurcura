import React, { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  DollarSign,
  Home,
  LayoutDashboard,
  Menu,
  Settings,
  User,
  Users,
  BarChart,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'Doctors', path: '/admin/doctors', icon: <Users size={18} /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <BarChart size={18} /> },
    { name: 'Appointments', path: '/admin/appointments', icon: <Calendar size={18} /> },
    { name: 'Payments', path: '/admin/payments', icon: <DollarSign size={18} /> },
    { name: 'Treatments', path: '/admin/treatments', icon: <BookOpen size={18} /> },
    { name: 'Articles', path: '/admin/articles', icon: <FileText size={18} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
  ];

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <a className="text-xl font-bold text-primary mr-8">AyurCure</a>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a className="px-3 py-2 text-sm font-medium rounded-md hover:bg-neutral-100 flex items-center gap-2">
                    {item.icon}
                    {item.name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <a className="text-sm font-medium hover:text-primary hidden md:flex items-center gap-1">
                <Home size={16} />
                Front Page
              </a>
            </Link>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User size={16} />
                    {user.username}
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <a className="cursor-pointer w-full">My Profile</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/appointments">
                      <a className="cursor-pointer w-full">My Appointments</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="sm">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader className="mb-4">
                  <SheetTitle>Admin Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-2">
                  {navItems.map((item) => (
                    <SheetClose key={item.path} asChild>
                      <Link href={item.path}>
                        <a className="px-4 py-2 text-base font-medium rounded-md hover:bg-neutral-100 flex items-center gap-2">
                          {item.icon}
                          {item.name}
                        </a>
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link href="/">
                      <a className="px-4 py-2 text-base font-medium rounded-md hover:bg-neutral-100 flex items-center gap-2 mt-4">
                        <Home size={18} />
                        Back to Home
                      </a>
                    </Link>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;