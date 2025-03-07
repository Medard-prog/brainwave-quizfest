
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutDashboard, Plus, BarChart, Settings, LogOut, Users, PlaySquare, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Logo from './Logo';

interface SidebarLinkProps {
  icon: React.ElementType;
  href: string;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

const SidebarLink = ({ icon: Icon, href, label, isActive, isCollapsed, onClick }: SidebarLinkProps) => {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={cn(
        "flex items-center py-3 px-4 rounded-lg transition-colors",
        isCollapsed ? "justify-center" : "justify-start",
        isActive
          ? "bg-brainblitz-primary text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-brainblitz-text"
      )}
    >
      <Icon size={20} />
      {!isCollapsed && <span className="ml-3 font-medium">{label}</span>}
    </Link>
  );
};

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  
  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    
    // For other paths, check if the location starts with the path
    if (path !== '/dashboard') {
      return location.pathname.startsWith(path);
    }
    
    return false;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div 
      className={cn(
        "h-screen sticky top-0 z-30 flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-6 flex items-center justify-between border-b border-gray-200">
        {!isCollapsed && <Logo size="sm" />}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      {/* Sidebar Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <SidebarLink
          icon={LayoutDashboard}
          href="/dashboard"
          label="Dashboard"
          isActive={isActive('/dashboard')}
          isCollapsed={isCollapsed}
        />
        
        <SidebarLink
          icon={Plus}
          href="/create-quiz"
          label="Create Quiz"
          isActive={isActive('/create-quiz')}
          isCollapsed={isCollapsed}
        />
        
        <SidebarLink
          icon={BookOpen}
          href="/my-quizzes"
          label="My Quizzes"
          isActive={isActive('/my-quizzes')}
          isCollapsed={isCollapsed}
        />
        
        <SidebarLink
          icon={PlaySquare}
          href="/host"
          label="Host Game"
          isActive={isActive('/host')}
          isCollapsed={isCollapsed}
        />
        
        <SidebarLink
          icon={BarChart}
          href="/analytics"
          label="Analytics"
          isActive={isActive('/analytics')}
          isCollapsed={isCollapsed}
        />
        
        <SidebarLink
          icon={Users}
          href="/participants"
          label="Participants"
          isActive={isActive('/participants')}
          isCollapsed={isCollapsed}
        />
      </div>
      
      {/* Sidebar Footer */}
      <div className="py-4 px-3 mt-auto space-y-1">
        <SidebarLink
          icon={Settings}
          href="/settings"
          label="Settings"
          isActive={isActive('/settings')}
          isCollapsed={isCollapsed}
        />
        
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center py-3 px-4 rounded-lg transition-colors w-full text-left",
            isCollapsed ? "justify-center" : "justify-start",
            "text-gray-600 hover:bg-gray-100 hover:text-brainblitz-text"
          )}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="ml-3 font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
