
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Only show loading indicator after a short delay to prevent flashing
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let longTimeout: NodeJS.Timeout;
    
    if (isLoading) {
      timeout = setTimeout(() => {
        setShowLoading(true);
      }, 300);
      
      // Show timeout message after extended period
      longTimeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 8000);
    } else {
      setShowLoading(false);
      setLoadingTimeout(false);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
      if (longTimeout) clearTimeout(longTimeout);
    };
  }, [isLoading]);

  // Loading timeout - user might be stuck
  if (loadingTimeout) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-amber-600 mb-4">Authentication Taking Too Long</h2>
          <p className="mb-4">We're having trouble checking your authentication status. This could be due to:</p>
          <ul className="list-disc list-inside mb-6 space-y-1">
            <li>Network connection issues</li>
            <li>Authentication service problems</li>
            <li>Corrupted local session data</li>
          </ul>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Reload Page
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem('supabase.auth.token');
                window.location.reload();
              }}
              className="w-full"
            >
              Clear Session & Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If loading and we've passed the delay threshold, show spinner
  if (isLoading && showLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-brainblitz-dark-gray">Checking authentication...</p>
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
