
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

const FeatureCard = ({ icon: Icon, title, description, className }: FeatureCardProps) => {
  return (
    <div 
      className={cn(
        "p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-brainblitz-primary/10 flex items-center justify-center mb-4">
        <Icon className="text-brainblitz-primary" size={24} />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-brainblitz-dark-gray">{description}</p>
    </div>
  );
};

export default FeatureCard;
