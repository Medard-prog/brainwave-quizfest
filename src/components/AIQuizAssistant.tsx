
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AIQuizAssistantProps {
  onGenerateQuiz?: (questions: any[]) => void;
}

const AIQuizAssistant = ({ onGenerateQuiz }: AIQuizAssistantProps) => {
  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }

    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Mock generated questions
      const mockQuestions = [
        {
          question: "What is the capital of France?",
          options: ["London", "Berlin", "Paris", "Madrid"],
          answer: "Paris",
        },
        {
          question: "Which planet is known as the Red Planet?",
          options: ["Earth", "Mars", "Jupiter", "Venus"],
          answer: "Mars",
        },
        {
          question: "Who painted the Mona Lisa?",
          options: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso", "Michelangelo"],
          answer: "Leonardo da Vinci",
        },
        {
          question: "What is the largest ocean on Earth?",
          options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
          answer: "Pacific Ocean",
        },
      ];
      
      setLoading(false);
      toast.success("Quiz generated successfully!");
      
      if (onGenerateQuiz) {
        onGenerateQuiz(mockQuestions);
      }
    }, 2000);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-brainblitz-primary" size={20} />
        <h3 className="text-lg font-semibold">AI Quiz Assistant</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-brainblitz-dark-gray mb-1">
            Quiz Topic
          </label>
          <Input
            id="topic"
            placeholder="e.g., World Geography, Math Fractions, Space Exploration"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-brainblitz-dark-gray mb-1">
            Additional Instructions (Optional)
          </label>
          <Textarea
            id="instructions"
            placeholder="e.g., Target 5th grade students, include visual elements, focus on historical events"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
        
        <Button
          onClick={handleGenerate}
          disabled={loading || !topic}
          className="w-full bg-gradient-to-r from-brainblitz-primary to-indigo-600 text-white hover:from-brainblitz-primary/90 hover:to-indigo-600/90"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Quiz
            </>
          )}
        </Button>
        
        <p className="text-xs text-brainblitz-medium-gray mt-2">
          Free plan allows up to 5 AI-generated questions per quiz.
          <a href="/pricing" className="text-brainblitz-primary ml-1 hover:underline">
            Upgrade for more
          </a>
        </p>
      </div>
    </div>
  );
};

export default AIQuizAssistant;
