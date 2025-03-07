
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, session, refreshUserProfile } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  
  // Only show loading indicator after a short delay to prevent flashing
  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout;
    let retryTimeout: NodeJS.Timeout;
    
    if (isLoading) {
      // Show loading spinner after 300ms
      loadingTimeout = setTimeout(() => {
        setShowLoading(true);
      }, 300);
      
      // Show retry button after 10 seconds
      retryTimeout = setTimeout(() => {
        setShowRetry(true);
      }, 10000);
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
  
  // If still loading but not past threshold, render nothing
  if (isLoading) {
    return null;
  }

  // Check for edge case: session exists but no user profile
  if (session && !user) {
    console.error("Session exists but no user profile found");
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Authentication Issue</h2>
          <p className="text-yellow-700 mb-4">
            You're logged in, but we couldn't find your user profile. This may be due to a database issue.
          </p>
          <div className="flex gap-4">
            <Button onClick={handleRetry} className="flex items-center gap-2">
              <RefreshCw size={16} />
              Retry
            </Button>
            <Button asChild variant="outline">
              <Navigate to="/logout" replace />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If not loading and no user, redirect to login
  if (!user) {
    console.log("No user found, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
