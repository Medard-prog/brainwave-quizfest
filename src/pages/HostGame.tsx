import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Play, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Quiz } from "@/lib/types";

const HostGame = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!quizId || !user) return;
    
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();
        
        if (quizError) {
          console.error("Error fetching quiz:", quizError);
          toast.error("Failed to load quiz");
          navigate('/my-quizzes');
          return;
        }
        
        if (quizData.creator_id !== user.id) {
          toast.error("You don't have permission to host this quiz");
          navigate('/my-quizzes');
          return;
        }
        
        setQuiz(quizData);
      } catch (error) {
        console.error("Error in fetchQuiz:", error);
        toast.error("An error occurred while loading quiz data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId, user, navigate]);
  
  const startGame = async () => {
    if (!user || !quiz) return;
    
    try {
      setIsLoading(true);
      
      // Only generate game pin if it doesn't exist yet
      if (!quiz.game_pin) {
        console.log("Generating game PIN");
        
        // Generate a unique 6-digit PIN
        const generatePin = () => {
          return Math.floor(100000 + Math.random() * 900000).toString();
        };
        
        let pin = generatePin();
        let isUnique = false;
        
        // Check if PIN is unique
        while (!isUnique) {
          const { data, error } = await supabase
            .from('quizzes')
            .select('id')
            .eq('game_pin', pin);
          
          if (error) {
            console.error("Error checking PIN uniqueness:", error);
            throw error;
          }
          
          isUnique = !data || data.length === 0;
          
          if (!isUnique) {
            pin = generatePin();
          }
        }
        
        // Update quiz with the new PIN
        const { error: updateError } = await supabase
          .from('quizzes')
          .update({ game_pin: pin })
          .eq('id', quiz.id);
        
        if (updateError) {
          console.error("Error updating quiz with PIN:", updateError);
          throw updateError;
        }
        
        // Update local quiz state
        setQuiz({ ...quiz, game_pin: pin });
      }
      
      // Create a new game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          quiz_id: quiz.id,
          host_id: user.id,
          status: 'waiting',
          current_question_index: 0
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error("Error creating game session:", sessionError);
        toast.error("Failed to start the game. Please try again.");
        throw sessionError;
      }
      
      console.log("Game session created:", sessionData);
      
      // Navigate to the presentation page
      navigate(`/present/${sessionData.id}`);
      
    } catch (error) {
      console.error("Error in startGame:", error);
      toast.error("An error occurred while starting the game");
    } finally {
      setIsLoading(false);
    }
  };

  const stopGame = async () => {
    if (!user || !quiz) return;
    
    try {
      setIsLoading(true);
      
      // Remove the game PIN from the quiz
      const { error: updateError } = await supabase
        .from('quizzes')
        .update({ game_pin: null })
        .eq('id', quiz.id);
      
      if (updateError) {
        console.error("Error removing game PIN:", updateError);
        toast.error("Failed to stop the game. Please try again.");
        throw updateError;
      }
      
      // Update local quiz state
      setQuiz({ ...quiz, game_pin: null });
      
      toast.success("Game stopped successfully");
    } catch (error) {
      console.error("Error in stopGame:", error);
      toast.error("An error occurred while stopping the game");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
          <p className="mb-6">The quiz you're looking for doesn't exist or you don't have access to it.</p>
          <Button asChild>
            <a href="/my-quizzes">Back to My Quizzes</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Host Game</h1>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">{quiz.title}</h2>
            <p className="text-brainblitz-dark-gray mb-4">
              {quiz.description || "No description provided"}
            </p>
            
            {quiz.game_pin ? (
              <div className="mb-4">
                <p className="text-sm text-brainblitz-dark-gray mb-1">
                  Current Game PIN:
                </p>
                <div className="text-2xl font-bold text-green-500">
                  {quiz.game_pin}
                </div>
                <p className="text-sm text-brainblitz-dark-gray mt-1">
                  Share this PIN with your players to join the game.
                </p>
              </div>
            ) : (
              <p className="text-sm text-brainblitz-dark-gray mb-4">
                No game PIN generated yet. Start the game to generate a PIN.
              </p>
            )}
            
            <div className="flex justify-between">
              {quiz.game_pin ? (
                <Button 
                  variant="destructive"
                  onClick={stopGame}
                  disabled={isLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Stop Game
                </Button>
              ) : (
                <Button 
                  onClick={startGame}
                  disabled={isLoading}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Game
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HostGame;
