
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);
  
  // Only show loading indicator after a short delay to prevent flashing
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isLoading) {
      timeout = setTimeout(() => {
        setShowLoading(true);
      }, 300);
    } else {
      setShowLoading(false);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading]);

  // If loading and we've passed the delay threshold, show spinner
  if (isLoading && showLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-brainblitz-dark-gray">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // If still loading but not past threshold, render nothing
  if (isLoading) {
    return null;
  }

  // If user is logged in, redirect them to dashboard
  if (user) {
    const from = location.state?.from?.pathname || "/dashboard";
    console.log("User is logged in, redirecting to:", from);
    return <Navigate to={from} replace />;
  }

  // Not logged in, render children (login/register page)
  return <>{children}</>;
};

export default PublicRoute;
