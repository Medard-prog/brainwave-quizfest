
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import MainLayout from "@/layouts/MainLayout";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a recovery token in the URL
    const hash = window.location.hash;
    const accessToken = hash
      .substring(1)
      .split("&")
      .find((param) => param.startsWith("access_token="));
    
    if (accessToken) {
      setIsValid(true);
    } else {
      toast({
        title: "Invalid reset link",
        description: "This password reset link is invalid or has expired",
        variant: "destructive",
      });
      setTimeout(() => navigate("/login"), 3000);
    }
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await updatePassword(password);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully reset",
      });
      
      setTimeout(() => navigate("/login"), 2000);
      
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValid) {
    return (
      <MainLayout withPadding={false}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brainblitz-primary mx-auto mb-6"></div>
            <h2 className="text-xl font-bold mb-2">Verifying your reset link...</h2>
            <p className="text-brainblitz-dark-gray">Please wait while we verify your password reset link.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout withPadding={false}>
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center">
            <Logo size="lg" className="mb-6" />
            
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-brainblitz-dark-gray">
              Enter your new password below
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                New Password
              </label>
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
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                placeholder="••••••••"
                required
              />
            </div>
            
            <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isLoading}>
              {isLoading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
              ) : (
                <Save size={18} />
              )}
              Reset password
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default ResetPassword;
