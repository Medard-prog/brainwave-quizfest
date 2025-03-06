
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "primary" | "white" | "gray";
}

export function Spinner({ size = "md", className, color = "primary" }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };
  
  const colorClasses = {
    primary: "border-t-transparent border-brainblitz-primary",
    white: "border-t-transparent border-white",
    gray: "border-t-transparent border-gray-400",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      aria-label="Loading"
    />
  );
}
