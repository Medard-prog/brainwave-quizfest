
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/spinner';

const Logout = () => {
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut();
        
        // Clear any potential corrupted auth state
        localStorage.removeItem('supabase.auth.token');
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          setIsLoggingOut(false);
        }, 500);
      } catch (error: any) {
        console.error('Logout error:', error);
        setError(error.message || 'Failed to log out properly');
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, [signOut]);

  if (isLoggingOut) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Spinner size="lg" className="mb-4" />
        <h1 className="text-xl font-medium">Logging you out...</h1>
        <p className="text-brainblitz-dark-gray mt-2">Please wait while we securely log you out.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Logout Error</h2>
          <p className="mb-6">{error}</p>
          <div className="flex justify-center">
            <a 
              href="/" 
              className="px-4 py-2 bg-brainblitz-primary text-white rounded-lg hover:bg-brainblitz-primary/90 transition-colors"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to home page after successful logout
  return <Navigate to="/" replace />;
};

export default Logout;
