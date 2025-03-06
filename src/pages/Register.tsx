
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import MainLayout from "@/layouts/MainLayout";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
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
      const { error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        username: username || undefined,
      });
      
      if (error) {
        throw error;
      }
      
      // Redirect to login page after successful registration
      navigate("/login", { replace: true });
      
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
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
              Create your account
            </h2>
            <p className="text-center text-brainblitz-dark-gray mb-8">
              Join BrainBlitz and start creating engaging quizzes
            </p>
            
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  Username (optional)
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                  placeholder="johndoe"
                />
              </div>
              
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
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
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
                  Confirm Password
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
                  <UserPlus size={18} />
                )}
                Create account
              </Button>
            </form>
            
            <p className="mt-8 text-center text-sm text-brainblitz-dark-gray">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-brainblitz-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        
        {/* Right side - Image */}
        <div className="hidden sm:block sm:w-1/2 bg-brainblitz-primary">
          <div className="h-full flex items-center justify-center p-12">
            <div className="max-w-md text-white">
              <h2 className="text-3xl font-bold mb-6">Take your teaching to the next level</h2>
              <p className="text-lg opacity-90">
                Create, share, and analyze quizzes with ease. Make learning fun and engaging for your students with BrainBlitz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
