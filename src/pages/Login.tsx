
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import MainLayout from "@/layouts/MainLayout";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      // Navigate to the page they were trying to access or dashboard
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
      
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isLoading}>
                {isLoading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
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
