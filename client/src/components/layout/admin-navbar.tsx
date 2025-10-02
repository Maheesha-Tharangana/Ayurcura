import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  UserRound, 
  ClipboardList, 
  PieChart, 
  LayoutDashboard, 
  ArrowLeft 
} from "lucide-react";

export default function AdminNavbar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path || location.startsWith(path);
  };

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Doctors", path: "/admin/doctors", icon: UserRound },
    { name: "Appointments", path: "/admin/appointments", icon: CalendarDays },
    { name: "Articles", path: "/admin/articles", icon: ClipboardList },
    { name: "Analytics", path: "/admin/analytics", icon: PieChart },
  ];

  return (
    <div className="bg-neutral-100 py-4 mb-6 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center text-neutral-600">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Site
              </Button>
            </Link>
            <span className="text-neutral-400">|</span>
            <h1 className="text-lg font-semibold text-neutral-900">Admin Panel</h1>
          </div>
          
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center",
                      isActive(item.path) ? "bg-primary-500 text-white" : "text-neutral-600"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}