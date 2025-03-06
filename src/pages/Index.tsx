
import MainLayout from "@/layouts/MainLayout";
import HeroSection from "@/components/HeroSection";
import FeatureCard from "@/components/FeatureCard";
import CallToAction from "@/components/CallToAction";
import { 
  Brain, 
  Trophy, 
  LineChart, 
  UserCheck, 
  Sparkles,
  BarChart3,
  Users,
  Zap,
  Layers
} from "lucide-react";

const Index = () => {
  return (
    <MainLayout transparentNavbar={true} withPadding={false}>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Engaging Quizzes</h2>
            <p className="text-lg text-brainblitz-dark-gray max-w-3xl mx-auto">
              BrainBlitz combines AI assistance with gamification to create an unmatched learning experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Brain}
              title="AI Quiz Generation"
              description="Create comprehensive quizzes instantly with our AI assistant. Just provide a topic and let BrainBlitz do the rest."
            />
            <FeatureCard 
              icon={Sparkles}
              title="Multiple Quiz Types"
              description="Choose from multiple question formats including multiple choice, fill-in-the-blank, matching, and more."
            />
            <FeatureCard 
              icon={Trophy}
              title="Gamification Elements"
              description="Keep students engaged with points, badges, leaderboards, and custom avatars that make learning fun."
            />
            <FeatureCard 
              icon={LineChart}
              title="Detailed Analytics"
              description="Track student performance with comprehensive analytics and identify areas for improvement."
            />
            <FeatureCard 
              icon={UserCheck}
              title="Easy Sharing"
              description="Share quizzes with a simple 6-digit PIN or QR code. No student accounts required to play."
            />
            <FeatureCard 
              icon={Zap}
              title="Real-time Feedback"
              description="Students get instant feedback on their answers, enhancing the learning experience."
            />
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-brainblitz-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How BrainBlitz Works</h2>
            <p className="text-lg text-brainblitz-dark-gray max-w-3xl mx-auto">
              Create, share, and engage with just a few clicks
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center relative">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-brainblitz-primary text-white flex items-center justify-center font-bold">1</div>
              <Sparkles className="mx-auto mb-4 text-brainblitz-primary" size={40} />
              <h3 className="text-xl font-bold mb-2">Create a Quiz</h3>
              <p className="text-brainblitz-dark-gray">Use our intuitive editor or let our AI assistant generate questions for you.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm text-center relative">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-brainblitz-primary text-white flex items-center justify-center font-bold">2</div>
              <Users className="mx-auto mb-4 text-brainblitz-primary" size={40} />
              <h3 className="text-xl font-bold mb-2">Share with Students</h3>
              <p className="text-brainblitz-dark-gray">Share your quiz via a simple 6-digit PIN or QR code that students can scan.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm text-center relative">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-brainblitz-primary text-white flex items-center justify-center font-bold">3</div>
              <BarChart3 className="mx-auto mb-4 text-brainblitz-primary" size={40} />
              <h3 className="text-xl font-bold mb-2">Track Results</h3>
              <p className="text-brainblitz-dark-gray">Monitor progress and performance with detailed analytics and reporting.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-brainblitz-dark-gray max-w-3xl mx-auto">
              Choose the plan that works for you
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="bg-brainblitz-primary/10 text-brainblitz-primary font-medium px-4 py-1 rounded-full inline-block mb-4">Free</div>
              <h3 className="text-2xl font-bold mb-2">Free Plan</h3>
              <p className="text-3xl font-bold mb-6">$0 <span className="text-sm font-normal text-brainblitz-medium-gray">/month</span></p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unlimited quizzes</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Up to 10 questions per quiz</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Up to 30 players per quiz</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Basic quiz analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Limited AI-generated quiz assistance</span>
                </li>
              </ul>
              
              <button className="w-full py-2 px-4 border border-brainblitz-primary text-brainblitz-primary font-medium rounded-xl hover:bg-brainblitz-primary/5 transition-colors">
                Get Started
              </button>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md border-2 border-brainblitz-primary relative hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-brainblitz-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                Popular
              </div>
              <div className="bg-brainblitz-primary/10 text-brainblitz-primary font-medium px-4 py-1 rounded-full inline-block mb-4">Pro</div>
              <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
              <p className="text-3xl font-bold mb-6">$9.99 <span className="text-sm font-normal text-brainblitz-medium-gray">/month</span></p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unlimited quizzes</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Unlimited</strong> questions per quiz</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Up to <strong>100</strong> players per quiz</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Advanced</strong> quiz analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Full</strong> AI-generated quiz assistance</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Custom themes & branding</span>
                </li>
              </ul>
              
              <button className="w-full py-2 px-4 bg-brainblitz-primary text-white font-medium rounded-xl hover:bg-brainblitz-primary/90 transition-colors">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brainblitz-background">
        <div className="max-w-7xl mx-auto">
          <CallToAction 
            title="Ready to Transform Your Classroom?"
            description="Join thousands of teachers using BrainBlitz to create engaging, interactive quizzes."
            primaryButtonText="Get Started for Free"
            primaryButtonLink="/register"
            secondaryButtonText="Learn More"
            secondaryButtonLink="/#features"
          />
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="text-brainblitz-primary" size={24} />
                <span className="font-bold text-xl">BrainBlitz</span>
              </div>
              <p className="text-brainblitz-dark-gray mb-4">
                The AI-powered quiz platform that makes learning fun and engaging.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="/#features" className="text-brainblitz-dark-gray hover:text-brainblitz-primary transition-colors">Features</a></li>
                <li><a href="/#how-it-works" className="text-brainblitz-dark-gray hover:text-brainblitz-primary transition-colors">How It Works</a></li>
                <li><a href="/#pricing" className="text-brainblitz-dark-gray hover:text-brainblitz-primary transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-brainblitz-dark-gray hover:text-brainblitz-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="text-brainblitz-dark-gray hover:text-brainblitz-primary transition-colors">Blog</a></li>
                <li><a href="#" className="text-brainblitz-dark-gray hover:text-brainblitz-primary transition-colors">Tutorials</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-brainblitz-dark-gray hover:text-brainblitz-primary transition-colors">About Us</a></li>
                <li><a href="#" className="text-brainblitz-dark-gray hover:text-brainblitz-primary transition-colors">Contact</a></li>
                <li><a href="#" className="text-brainblitz-dark-gray hover:text-brainblitz-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-brainblitz-dark-gray hover:text-brainblitz-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-brainblitz-medium-gray">
              © {new Date().getFullYear()} BrainBlitz. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </MainLayout>
  );
};

export default Index;
