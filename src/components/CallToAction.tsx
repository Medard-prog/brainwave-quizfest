
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CallToActionProps {
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

const CallToAction = ({
  title,
  description,
  primaryButtonText,
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
}: CallToActionProps) => {
  return (
    <div className="bg-gradient-to-r from-brainblitz-primary/5 to-brainblitz-primary/10 rounded-2xl px-6 py-12 md:py-16 md:px-12 text-center">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        <p className="text-brainblitz-dark-gray text-lg mb-8">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            asChild
            size="lg"
            className="bg-brainblitz-primary hover:bg-brainblitz-primary/90 text-white rounded-xl px-8"
          >
            <Link to={primaryButtonLink}>
              {primaryButtonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          
          {secondaryButtonText && secondaryButtonLink && (
            <Button 
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl px-8 border-brainblitz-primary text-brainblitz-primary hover:bg-brainblitz-primary/5"
            >
              <Link to={secondaryButtonLink}>
                {secondaryButtonText}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallToAction;
