
import { ArrowRight, Brain, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden pt-20 pb-16 sm:pb-24 lg:pb-32 text-center">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[5%] w-72 h-72 bg-brainblitz-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute right-[15%] bottom-[10%] w-80 h-80 bg-brainblitz-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16">
        {/* Floating elements for decoration */}
        <div className="absolute -left-6 top-20 animate-float opacity-20">
          <Brain size={40} className="text-brainblitz-primary" />
        </div>
        <div className="absolute right-10 top-40 animate-float opacity-30" style={{ animationDelay: "1s" }}>
          <Sparkles size={32} className="text-brainblitz-accent" />
        </div>
        
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-1.5 mb-8 border border-brainblitz-primary/20 rounded-full text-sm font-medium text-brainblitz-primary bg-brainblitz-primary/5 animate-fade-in">
          <Sparkles size={16} className="mr-2" />
          <span>AI-Powered Quiz Platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 animate-slide-up">
          <span className="block">Engage. Learn.</span>
          <span className="block text-gradient">Gay.</span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl mx-auto text-xl text-brainblitz-dark-gray mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          The future of quizzing is here. Create engaging quizzes with AI, 
          track student progress, and make learning fun.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <Button 
            asChild
            size="lg"
            className="bg-brainblitz-primary hover:bg-brainblitz-primary/90 text-white rounded-xl px-8 py-6 text-lg shadow-md hover:shadow-lg transition-all"
          >
            <Link to="/register">
              Create Free Quiz
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button 
            asChild
            size="lg"
            variant="outline"
            className="rounded-xl px-8 py-6 text-lg border-brainblitz-primary text-brainblitz-primary hover:bg-brainblitz-primary/5"
          >
            <Link to="/join">
              Join a Game
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-center animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm">
            <p className="text-3xl font-bold text-brainblitz-primary">500K+</p>
            <p className="text-sm text-brainblitz-medium-gray">Active Users</p>
          </div>
          <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm">
            <p className="text-3xl font-bold text-brainblitz-primary">10M+</p>
            <p className="text-sm text-brainblitz-medium-gray">Quizzes Taken</p>
          </div>
          <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm col-span-2 md:col-span-1">
            <p className="text-3xl font-bold text-brainblitz-primary">98%</p>
            <p className="text-sm text-brainblitz-medium-gray">Teacher Satisfaction</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
