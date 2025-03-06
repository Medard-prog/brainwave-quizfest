
import { Brain } from "lucide-react";
import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const sizeMap = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const iconSizeMap = {
    sm: 18,
    md: 24,
    lg: 32,
  };

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center">
        <Brain 
          size={iconSizeMap[size]} 
          className="text-brainblitz-primary animate-pulse-soft" 
        />
        <div className="absolute inset-0 bg-brainblitz-primary/20 rounded-full blur-md animate-pulse-soft"></div>
      </div>
      {showText && (
        <span className={`font-bold ${sizeMap[size]} bg-clip-text text-transparent bg-gradient-to-r from-brainblitz-primary to-indigo-700`}>
          BrainBlitz
        </span>
      )}
    </Link>
  );
};

export default Logo;
