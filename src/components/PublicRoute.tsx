
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isLoading, refreshUserProfile } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  
  // Only show loading indicator after a short delay to prevent flashing
  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout;
    let retryTimeout: NodeJS.Timeout;
    
    if (isLoading) {
      // Show loading spinner after 500ms
      loadingTimeout = setTimeout(() => {
        setShowLoading(true);
      }, 500);
      
      // Show retry button after 8 seconds
      retryTimeout = setTimeout(() => {
        setShowRetry(true);
      }, 8000);
    } else {
      setShowLoading(false);
      setShowRetry(false);
    }
    
    return () => {
      clearTimeout(loadingTimeout);
      clearTimeout(retryTimeout);
    };
  }, [isLoading]);

  // Handle manual refresh
  const handleRetry = async () => {
    setShowRetry(false);
    await refreshUserProfile();
  };

  // If loading and we've passed the delay threshold, show spinner
  if (isLoading && showLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-brainblitz-dark-gray">Verifying authentication...</p>
          
          {showRetry && (
            <div className="mt-4">
              <p className="text-red-500 mb-2">This is taking longer than expected.</p>
              <Button onClick={handleRetry} className="flex items-center gap-2">
                <RefreshCw size={16} />
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // If still loading but not past threshold, render nothing to prevent flicker
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
