
import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const DashboardLayout = ({ 
  children, 
  className = "",
}: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex min-h-screen bg-brainblitz-background">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <main 
        className={cn(
          "flex-1", 
          className
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
