import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, User, Settings } from "lucide-react";
import { NotificationBell } from "@/components/ui/notification-bell";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Find Doctors", path: "/doctors" },
    { name: "Treatments", path: "/treatments" },
    { name: "Articles", path: "/articles" },
    
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="flex items-center cursor-pointer">
                  <i className="ri-plant-line text-primary-600 text-2xl mr-2"></i>
                  <span className="ayurcura-logo text-primary-600 text-xl tracking-tight">AyurCura</span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-10 sm:flex sm:space-x-6">
              {navLinks.map((link) => (
                <Link key={link.path} href={link.path}>
                  <span className={`nav-link ${isActive(link.path) ? 'nav-link-active' : 'nav-link-inactive'}`}>
                    {link.name}
                  </span>
                </Link>
              ))}
              
              {/* Admin link - only show to admins */}
              {user && user.role === "admin" && (
                <Link href="/admin">
                  <span className={`nav-link ${isActive('/admin') ? 'nav-link-active' : 'nav-link-inactive'}`}>
                    Admin
                  </span>
                </Link>
              )}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Notifications - shown when logged in */}
            {user && (
              <div className="relative mr-3">
                <NotificationBell />
              </div>
            )}
            
            {/* User Menu or Auth Buttons */}
            {user ? (
              <div className="ml-3 relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarFallback className="bg-primary-100 text-primary-700">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium">{user.fullName || user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link href="/profile">
                        <div className="flex items-center cursor-pointer w-full">
                          <User className="mr-2 h-4 w-4" />
                          My Profile
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem>
                        <Link href="/admin">
                          <div className="flex items-center cursor-pointer w-full">
                            <Settings className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/auth">
                <Button>Log In</Button>
              </Link>
            )}
            
            {/* Book Appointment Button */}
            <Link href="/doctors">
              <Button variant="default" className="ml-6">
                Book Appointment
              </Button>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col h-full py-6">
                  <div className="px-4 mb-6">
                    <span className="flex items-center">
                      <i className="ri-plant-line text-primary-500 text-xl mr-2"></i>
                      <span className="ayurcura-logo text-primary-500 text-lg">AyurCura</span>
                    </span>
                  </div>
                  
                  <div className="px-4 space-y-1">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.path}>
                        <Link href={link.path}>
                          <span className={`block px-3 py-2 rounded-md text-base font-medium ${
                            isActive(link.path) 
                              ? 'bg-primary-50 text-primary-700' 
                              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                          }`}>
                            {link.name}
                          </span>
                        </Link>
                      </SheetClose>
                    ))}
                    
                    {user && user.role === "admin" && (
                      <SheetClose asChild>
                        <Link href="/admin">
                          <span className={`block px-3 py-2 rounded-md text-base font-medium ${
                            isActive('/admin') 
                              ? 'bg-primary-50 text-primary-700' 
                              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                          }`}>
                            Admin
                          </span>
                        </Link>
                      </SheetClose>
                    )}
                  </div>
                  
                  <div className="mt-auto px-4">
                    {user ? (
                      <div className="pt-4 border-t border-neutral-200">
                        <div className="flex items-center mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary-100 text-primary-700">
                              {getInitials(user.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-neutral-700">{user.fullName || user.username}</p>
                            <p className="text-xs text-neutral-500">{user.email}</p>
                          </div>
                        </div>
                        <SheetClose asChild>
                          <Link href="/profile">
                            <Button variant="outline" className="w-full justify-center mb-2">
                              <User className="mr-2 h-4 w-4" />
                              My Profile
                            </Button>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button className="w-full justify-center" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                          </Button>
                        </SheetClose>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-neutral-200 space-y-3">
                        <SheetClose asChild>
                          <Link href="/auth">
                            <Button className="w-full justify-center">
                              Log In
                            </Button>
                          </Link>
                        </SheetClose>
                      </div>
                    )}
                    <SheetClose asChild>
                      <Link href="/doctors">
                        <Button variant="outline" className="w-full justify-center mt-3">
                          Book Appointment
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
