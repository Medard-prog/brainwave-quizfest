
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import AvatarMenu from "./AvatarMenu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  transparent?: boolean;
}

const Navbar = ({ transparent = false }: NavbarProps) => {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "/#features" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Pricing", href: "/#pricing" },
  ];

  const navbarClasses = cn(
    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-6 lg:px-8",
    {
      "py-4": !isScrolled,
      "py-2 shadow-sm": isScrolled,
      "bg-transparent": transparent && !isScrolled,
      "bg-white/80 backdrop-blur-md": !transparent || isScrolled,
    }
  );

  return (
    <header className={navbarClasses}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Logo size="md" />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-brainblitz-text hover:text-brainblitz-primary transition-colors text-sm font-medium"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Button
            asChild
            variant="ghost"
            className="text-brainblitz-primary hover:text-brainblitz-primary/80"
          >
            <Link to="/join">Join Game</Link>
          </Button>
          {user ? (
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="ghost"
                className="text-brainblitz-primary hover:text-brainblitz-primary/80"
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <AvatarMenu user={{ name: user.first_name || user.username, email: user.email, avatar: user.avatar_url }} />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                to="/login"
                className="text-brainblitz-text hover:text-brainblitz-primary transition-colors"
              >
                Log in
              </Link>
              <Link 
                to="/register"
                className="bg-brainblitz-primary text-white px-4 py-2 rounded-xl hover:bg-brainblitz-primary/90 transition-all"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-brainblitz-text focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white absolute top-full left-0 right-0 shadow-lg animate-slide-down">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="block py-2 text-brainblitz-text hover:text-brainblitz-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/join"
              className="block py-2 text-brainblitz-primary font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Join Game
            </Link>
            <div className="pt-4 border-t border-gray-200">
              {user ? (
                <Link
                  to="/dashboard"
                  className="block py-2 mt-2 bg-brainblitz-primary text-white rounded-xl px-4 text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block py-2 text-brainblitz-text hover:text-brainblitz-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="block py-2 mt-2 bg-brainblitz-primary text-white rounded-xl px-4 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
