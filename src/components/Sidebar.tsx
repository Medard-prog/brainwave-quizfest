
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import {
  BookOpen,
  Home,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  TrendingUp,
  Users,
  Menu,
  X,
  Brain,
  Trophy,
  BookOpenCheck,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
}

const SidebarLink = ({ to, icon: Icon, label, isCollapsed, isActive }: SidebarLinkProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={to}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-brainblitz-primary/10 group",
              isActive ? "bg-brainblitz-primary/10 text-brainblitz-primary" : "text-brainblitz-text"
            )}
          >
            <Icon size={20} className={cn(isActive ? "text-brainblitz-primary" : "text-brainblitz-text/70 group-hover:text-brainblitz-primary/70")} />
            {!isCollapsed && (
              <span className={cn("text-sm font-medium", isActive ? "text-brainblitz-primary" : "text-brainblitz-text/90 group-hover:text-brainblitz-primary/90")}>
                {label}
              </span>
            )}
          </Link>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
};

interface SidebarProps {
  defaultCollapsed?: boolean;
}

const Sidebar = ({ defaultCollapsed = false }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const sidebarLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/create-quiz", icon: PlusCircle, label: "Create Quiz" },
    { to: "/my-quizzes", icon: BookOpen, label: "My Quizzes" },
    { to: "/library", icon: BookOpenCheck, label: "Quiz Library" },
    { to: "/analytics", icon: TrendingUp, label: "Analytics" },
    { to: "/students", icon: Users, label: "Students" },
    { to: "/achievements", icon: Trophy, label: "Achievements" },
  ];

  const bottomLinks = [
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = () => {
    // Implement logout logic here
    console.log("Logging out");
  };

  // Classes for sidebar
  const sidebarClasses = cn(
    "fixed top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-40",
    isCollapsed ? "w-[70px]" : "w-[240px]",
    isMobileOpen ? "left-0" : "-left-[240px] md:left-0"
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden animate-fade-in"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        className="fixed bottom-4 right-4 md:hidden z-40 bg-brainblitz-primary text-white p-3 rounded-full shadow-lg hover:bg-brainblitz-primary/90 transition-colors"
        onClick={toggleMobileSidebar}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={cn(
            "flex items-center h-16 px-4 border-b border-gray-200",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed ? (
              <Logo size="sm" />
            ) : (
              <div className="flex justify-center items-center">
                <Brain className="text-brainblitz-primary" size={24} />
              </div>
            )}
            {!isCollapsed && (
              <button 
                onClick={toggleSidebar}
                className="text-brainblitz-medium-gray hover:text-brainblitz-primary transition-colors"
              >
                <Menu size={18} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-6 px-3">
            <div className="space-y-1">
              {sidebarLinks.map((link) => (
                <SidebarLink
                  key={link.to}
                  to={link.to}
                  icon={link.icon}
                  label={link.label}
                  isCollapsed={isCollapsed}
                  isActive={isActive(link.to)}
                />
              ))}
            </div>
            
            {/* Create Quiz Button */}
            <div className="mt-6 px-3">
              <Link
                to="/create-quiz"
                className={cn(
                  "flex items-center gap-2 justify-center w-full py-2.5 bg-brainblitz-primary text-white rounded-xl hover:bg-brainblitz-primary/90 transition-colors",
                  isCollapsed ? "px-0" : "px-4"
                )}
              >
                <PlusCircle size={18} />
                {!isCollapsed && <span className="text-sm font-medium">New Quiz</span>}
              </Link>
            </div>
          </nav>

          {/* Bottom Links */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-1">
              {bottomLinks.map((link) => (
                <SidebarLink
                  key={link.to}
                  to={link.to}
                  icon={link.icon}
                  label={link.label}
                  isCollapsed={isCollapsed}
                  isActive={isActive(link.to)}
                />
              ))}
              
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all hover:bg-red-50 text-red-500 hover:text-red-600",
                )}
              >
                <LogOut size={20} />
                {!isCollapsed && <span className="text-sm font-medium">Log Out</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
