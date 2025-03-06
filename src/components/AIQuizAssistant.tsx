
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface AIQuizAssistantProps {
  onGenerateQuiz?: (questions: any[]) => void;
  onGenerateQuestions?: (questions: any[]) => void;
  onClose?: () => void;
}

const AIQuizAssistant = ({ onGenerateQuiz, onGenerateQuestions, onClose }: AIQuizAssistantProps) => {
  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { topic, instructions }
      });
      
      if (error) {
        console.error("Error generating quiz:", error);
        toast.error("Failed to generate quiz");
        setLoading(false);
        return;
      }
      
      if (data?.questions && Array.isArray(data.questions)) {
        toast.success("Quiz generated successfully!");
        
        // Call both callback props if they exist
        if (onGenerateQuiz) {
          onGenerateQuiz(data.questions);
        }
        
        if (onGenerateQuestions) {
          onGenerateQuestions(data.questions);
        }
        
        // Close the modal after generation if onClose exists
        if (onClose) {
          onClose();
        }
      } else {
        toast.error("Invalid response format from AI");
        console.error("Invalid response:", data);
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-md w-full relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
        
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
    </div>
  );
};

export default AIQuizAssistant;
