
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import MainLayout from "@/layouts/MainLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        throw error;
      }
      
      setIsSubmitted(true);
      
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
              {isSubmitted
                ? "Check your email for a password reset link"
                : "Enter your email address and we'll send you a link to reset your password"}
            </p>
          </div>
          
          {isSubmitted ? (
            <div className="mt-8 space-y-6">
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-green-800 text-sm">
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Please check your email and follow the instructions to reset your password.
                </p>
              </div>
              <div className="flex flex-col space-y-4">
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Try with another email
                </Button>
                <Link to="/login">
                  <Button variant="ghost" className="w-full flex items-center gap-2">
                    <ArrowLeft size={16} />
                    Back to sign in
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
              
              <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isLoading}>
                {isLoading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                ) : (
                  <Mail size={18} />
                )}
                Send reset link
              </Button>
              
              <div className="text-center">
                <Link to="/login" className="text-sm text-brainblitz-primary hover:underline flex items-center justify-center gap-1">
                  <ArrowLeft size={16} />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ForgotPassword;
