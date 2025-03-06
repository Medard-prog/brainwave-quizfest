
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import MainLayout from "@/layouts/MainLayout";
import { ArrowLeft, Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (!agreeTerms) {
      toast.error("You must agree to the terms and conditions");
      return;
    }
    
    setIsLoading(true);
    
    // Simulate registration process
    setTimeout(() => {
      toast.success("Account created successfully!");
      setIsLoading(false);
      navigate("/dashboard");
    }, 1500);
  };
  
  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <Link to="/" className="flex items-center text-brainblitz-medium-gray hover:text-brainblitz-primary transition-colors mb-6">
              <ArrowLeft size={16} className="mr-2" />
              Back to home
            </Link>
            
            <h2 className="text-3xl font-bold text-center mb-2">Create your account</h2>
            <p className="text-brainblitz-medium-gray text-center">
              Join BrainBlitz and start creating amazing quizzes
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-brainblitz-dark-gray mb-1">
                  Full name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-gray-300"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-brainblitz-dark-gray mb-1">
                  Email address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-gray-300"
                  placeholder="name@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-brainblitz-dark-gray mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-xl relative block w-full px-3 py-2 border border-gray-300"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-brainblitz-medium-gray hover:text-brainblitz-dark-gray transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-brainblitz-medium-gray">
                  Password must be at least 8 characters long
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Checkbox 
                id="agree-terms" 
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                className="h-4 w-4 text-brainblitz-primary border-gray-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-brainblitz-dark-gray">
                I agree to the{" "}
                <Link to="/terms" className="text-brainblitz-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-brainblitz-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            
            <div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-6 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brainblitz-primary hover:bg-brainblitz-primary/90 focus:outline-none"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-brainblitz-medium-gray">
              Already have an account?{" "}
              <Link to="/login" className="text-brainblitz-primary hover:text-brainblitz-primary/80 transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
