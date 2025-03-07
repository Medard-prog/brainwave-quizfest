
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, isLoading } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Only show loading indicator after a short delay to prevent flashing
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let longTimeout: NodeJS.Timeout;
    
    if (isLoading) {
      // Show spinner after short delay
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

  // Handle case where session exists but no user profile
  useEffect(() => {
    if (!isLoading && session && !user) {
      console.error("Session exists but no user profile found");
      toast.error("Profile loading error", { 
        description: "Your profile information could not be loaded"
      });
    }
  }, [isLoading, session, user]);

  // Loading timeout - user might be stuck
  if (loadingTimeout) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Taking Too Long</h2>
          <p className="mb-4">We're having trouble verifying your authentication. This could be due to:</p>
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
                window.location.href = '/login';
              }}
              className="w-full"
            >
              Clear Session & Login Again
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
          <p className="text-brainblitz-dark-gray">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // If still loading but not past threshold, render nothing
  if (isLoading) {
    return null;
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
