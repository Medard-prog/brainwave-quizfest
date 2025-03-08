
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import MainLayout from "@/layouts/MainLayout";

const JoinWithPin = () => {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();
  
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [quiz, setQuiz] = useState<{
    id: string;
    title: string;
    description?: string;
    game_pin?: string;
    creator_id: string;
  } | null>(null);
  const [gameSession, setGameSession] = useState<{
    id: string;
    quiz_id: string;
    host_id: string;
    status: string;
    current_question_index?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Verify the PIN on component mount
  useEffect(() => {
    if (!pin) {
      setIsVerifying(false);
      setError("No game PIN provided");
      return;
    }
    
    const verifyPin = async () => {
      setIsVerifying(true);
      setError(null);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error("PIN verification timeout");
        setIsVerifying(false);
        setError("Verification timed out. Please try again.");
        navigate('/join');
      }, 10000); // 10 second timeout
      
      try {
        console.log("Verifying PIN:", pin);
        
        // Step 1: Get the quiz with this PIN
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('id, title, description, game_pin, creator_id')
          .eq('game_pin', pin)
          .maybeSingle();
        
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
        
        if (quizError) {
          console.error("Error verifying PIN:", quizError);
          setError("Failed to verify game PIN");
          toast.error("Invalid game PIN");
          navigate('/join');
          return;
        }
        
        if (!quizData) {
          console.error("No quiz found with PIN:", pin);
          setError("Invalid game PIN");
          toast.error("Invalid game PIN");
          navigate('/join');
          return;
        }
        
        console.log("Quiz found:", quizData);
        setQuiz(quizData);
        
        // Step 2: Find active game sessions for this quiz
        const { data: activeSessions, error: sessionsError } = await supabase
          .from('game_sessions')
          .select('id, quiz_id, host_id, status, current_question_index')
          .eq('quiz_id', quizData.id)
          .eq('status', 'waiting')
          .order('created_at', { ascending: false });
        
        if (sessionsError) {
          console.error("Error getting active sessions:", sessionsError);
          setError("Failed to find active game session");
          toast.error("No active game found for this PIN");
          navigate('/join');
          return;
        }
        
        if (!activeSessions || activeSessions.length === 0) {
          console.error("No active game session found for PIN:", pin);
          setError("No active game session found for this PIN");
          toast.error("No active game session found for this PIN");
          navigate('/join');
          return;
        }
        
        // Use the most recent session
        const sessionData = activeSessions[0];
        console.log("Game session found:", sessionData);
        setGameSession(sessionData);
        setIsVerifying(false);
        
      } catch (error) {
        // Clear the timeout since we got a response (an error)
        clearTimeout(timeoutId);
        console.error("Error in verifyPin:", error);
        setError("Failed to verify game PIN");
        toast.error("Failed to verify game PIN");
        navigate('/join');
      } finally {
        // Set isVerifying to false regardless of outcome
        setIsVerifying(false);
      }
    };
    
    verifyPin();
    
    // Cleanup function to clear timeout if component unmounts
    return () => {
      clearTimeout(timeoutId);
    };
  }, [pin, navigate]);
  
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim() || !gameSession) {
      toast.error("Please enter your name");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create a player session
      const { data: playerData, error: playerError } = await supabase
        .from('player_sessions')
        .insert({
          game_session_id: gameSession.id,
          player_name: playerName.trim(),
          score: 0,
          answers: []
        })
        .select('id, player_name, game_session_id')
        .single();
      
      if (playerError) {
        console.error("Error creating player session:", playerError);
        toast.error("Failed to join game");
        return;
      }
      
      console.log("Player session created:", playerData);
      
      // Navigate to game page
      navigate(`/play/${gameSession.id}`, {
        state: {
          playerSession: playerData,
          playerName: playerName.trim()
        }
      });
      
    } catch (error) {
      console.error("Error in handleJoinGame:", error);
      toast.error("An error occurred while joining the game");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isVerifying) {
    return (
      <MainLayout>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
            <Spinner size="lg" className="mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Verifying Game PIN</h2>
            <p className="text-brainblitz-dark-gray">Please wait while we connect you to the game...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="text-red-500 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-brainblitz-dark-gray mb-6">{error}</p>
            <Button onClick={() => navigate('/join')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Join Page
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-brainblitz-dark-gray"
              onClick={() => navigate('/join')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Join
            </Button>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Join Game</h2>
            
            {quiz && (
              <div className="mb-8">
                <div className="bg-brainblitz-primary/10 rounded-lg p-4">
                  <div className="font-semibold text-brainblitz-primary text-sm mb-1">QUIZ</div>
                  <div className="font-bold text-xl">{quiz.title}</div>
                  {quiz.description && (
                    <p className="text-brainblitz-dark-gray mt-2 text-sm">{quiz.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-brainblitz-dark-gray">Game PIN</span>
                    <span className="text-xl font-bold tracking-widest text-brainblitz-primary">{quiz.game_pin}</span>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleJoinGame}>
              <div className="mb-6">
                <Label htmlFor="player-name" className="text-base">Your Name</Label>
                <Input
                  id="player-name"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-2 py-6 text-lg"
                  required
                  autoFocus
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-brainblitz-primary hover:bg-brainblitz-primary/90 py-6 text-lg"
                disabled={isLoading || !playerName.trim()}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" color="white" className="mr-2" />
                    Joining...
                  </>
                ) : (
                  "Join Game"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default JoinWithPin;
