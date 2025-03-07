
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMobile } from "@/hooks/use-mobile";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  GraduationCap, 
  Settings, 
  Menu, 
  LogOut,
  Library
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobile, isOpen]);

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "My Quizzes",
      href: "/my-quizzes",
      icon: <Library className="h-5 w-5" />,
    },
    {
      title: "Create Quiz",
      href: "/create-quiz",
      icon: <PlusCircle className="h-5 w-5" />,
    },
    {
      title: "Participants",
      href: "/participants",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: <GraduationCap className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: "Logout",
      href: "/logout",
      icon: <LogOut className="h-5 w-5" />,
    },
  ];

  if (!mounted) {
    return null;
  }

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center px-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-semibold text-xl">BrainBlitz</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          onClick={onToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                location.pathname === item.href
                  ? "bg-brainblitz-primary/10 text-brainblitz-primary"
                  : "text-brainblitz-dark-gray hover:bg-brainblitz-primary/5"
              )}
            >
              {item.icon}
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
        <Separator className="my-4" />
      </ScrollArea>
    </>
  );

  if (isMobile) {
    return (
      <>
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-200",
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={onToggle}
        />
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 transform bg-white shadow-lg transition-transform duration-200",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <div className="hidden border-r bg-white md:flex md:w-64 md:flex-col">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;
