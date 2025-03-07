import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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
  const [quiz, setQuiz] = useState<any | null>(null);
  const [gameSession, setGameSession] = useState<any | null>(null);
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
        
        // Check if the PIN exists
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
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
        
        // Check if there is an active game session for this quiz
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('quiz_id', quizData.id)
          .eq('status', 'waiting')
          .order('created_at', { ascending: false })
          .maybeSingle();
        
        if (sessionError) {
          console.error("Error finding game session:", sessionError);
          setError("Failed to join game");
          toast.error("Failed to join game");
          navigate('/join');
          return;
        }
        
        if (!sessionData) {
          console.error("No active game session found for PIN:", pin);
          setError("No active game session found for this PIN");
          toast.error("No active game session found for this PIN");
          navigate('/join');
          return;
        }
        
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
      // No need to reference the timeoutId from verifyPin as it's not in scope here
      // Instead we clear all timeouts
      const id = setTimeout(() => {}, 0);
      for (let i = 0; i < id; i++) {
        clearTimeout(i);
      }
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
        .select()
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
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <Spinner size="lg" className="mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verifying Game PIN</h2>
            <p className="text-brainblitz-dark-gray">Please wait while we verify the game PIN...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-brainblitz-dark-gray mb-4">{error}</p>
            <Button onClick={() => navigate('/join')}>
              Return to Join Page
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-6">Join Game</h2>
          
          {quiz && (
            <div className="mb-6">
              <p className="text-sm text-brainblitz-dark-gray mb-1">You're joining:</p>
              <div className="font-semibold text-lg">{quiz.title}</div>
              {quiz.description && (
                <p className="text-brainblitz-dark-gray mt-1 text-sm">{quiz.description}</p>
              )}
            </div>
          )}
          
          <form onSubmit={handleJoinGame}>
            <div className="mb-6">
              <Label htmlFor="player-name">Your Name</Label>
              <Input
                id="player-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !playerName.trim()}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Joining...
                </>
              ) : (
                "Join Game"
              )}
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default JoinWithPin;
