
import React from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  transparentNavbar?: boolean;
  className?: string;
  withPadding?: boolean;
}

const MainLayout = ({ 
  children, 
  transparentNavbar = false,
  className = "",
  withPadding = true
}: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar transparent={transparentNavbar} />
      <main 
        className={cn(
          "flex-1", 
          withPadding && "pt-20",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
