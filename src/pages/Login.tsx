
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, LogIn, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import MainLayout from "@/layouts/MainLayout";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Missing information", {
        description: "Please enter both email and password",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      // Navigate handled by the useEffect above when user state changes
      
    } catch (error: unknown) {
      toast.error("Login failed", {
        description: error instanceof Error 
          ? error.message 
          : typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
            ? error.message
            : "Please check your credentials and try again"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading when auth is loading
  if (authLoading) {
    return (
      <MainLayout withPadding={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Logo size="lg" className="mb-6" />
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brainblitz-primary"></div>
            <p className="text-brainblitz-dark-gray">Loading authentication...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout withPadding={false}>
      <div className="flex min-h-screen">
        {/* Left side - Form */}
        <div className="flex flex-col justify-center w-full px-4 sm:px-6 lg:px-8 py-12 sm:w-1/2">
          <div className="mx-auto w-full max-w-sm">
            <div className="flex justify-center mb-8">
              <Logo size="lg" />
            </div>
            
            <h2 className="text-center text-3xl font-bold tracking-tight mb-4">
              Welcome back!
            </h2>
            <p className="text-center text-brainblitz-dark-gray mb-8">
              Please sign in to your account to continue
            </p>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm text-brainblitz-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}
                Sign in
              </Button>
            </form>
            
            <p className="mt-8 text-center text-sm text-brainblitz-dark-gray">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-brainblitz-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
        
        {/* Right side - Image */}
        <div className="hidden sm:block sm:w-1/2 bg-brainblitz-primary">
          <div className="h-full flex items-center justify-center p-12">
            <div className="max-w-md text-white">
              <h2 className="text-3xl font-bold mb-6">Revolutionize your classroom with interactive quizzes</h2>
              <p className="text-lg opacity-90">
                Create engaging learning experiences that students will remember. With BrainBlitz, education becomes an adventure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Login;
