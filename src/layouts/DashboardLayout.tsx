
import React from "react";
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
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main 
        className={cn(
          "flex-1 ml-[70px] md:ml-[240px] p-6 bg-brainblitz-background",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
