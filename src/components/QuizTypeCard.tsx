
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface QuizTypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  onClick?: () => void;
}

const QuizTypeCard = ({ icon: Icon, title, description, className, onClick }: QuizTypeCardProps) => {
  return (
    <div 
      className={cn(
        "p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-xl bg-brainblitz-primary/10 flex items-center justify-center mb-4">
        <Icon className="text-brainblitz-primary" size={24} />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-brainblitz-dark-gray">{description}</p>
    </div>
  );
};

export default QuizTypeCard;
