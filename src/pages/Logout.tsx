
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/spinner";

const Logout = () => {
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut();
      } catch (error: any) {
        console.error("Error during logout:", error);
        setError(error.message || "Failed to log out");
      } finally {
        setIsLoggingOut(false);
      }
    };
    
    performLogout();
  }, [signOut]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <p>Redirecting to home page...</p>
        <Navigate to="/" replace />
      </div>
    );
  }

  if (isLoggingOut) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <Spinner size="lg" />
        <p className="mt-4">Logging out...</p>
      </div>
    );
  }

  return <Navigate to="/" replace />;
};

export default Logout;
