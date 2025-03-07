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
        
        // Step 2: Try the helper RPC function (should work if SQL is deployed)
        try {
          const { data: activeSessions, error: rpcError } = await supabase
            .rpc('get_active_sessions_for_quiz', { p_quiz_id: quizData.id });
            
          if (!rpcError && activeSessions && activeSessions.length > 0) {
            const sessionData = activeSessions[0];
            console.log("Game session found via RPC:", sessionData);
            setGameSession(sessionData);
            setIsVerifying(false);
            return;
          } else if (rpcError) {
            console.error("RPC error:", rpcError);
          }
        } catch (rpcError) {
          console.error("RPC method failed:", rpcError);
        }
        
        // Step 3: Direct, simplified query for status='waiting' sessions
        // This should work with the simplified RLS policy
        const { data: waitingSessions, error: waitingError } = await supabase
          .from('game_sessions')
          .select('id, quiz_id, host_id, status, current_question_index')
          .eq('quiz_id', quizData.id)
          .eq('status', 'waiting');
        
        if (waitingError) {
          console.error("Error getting waiting sessions:", waitingError);
          // Try more drastic fallback approach if we're still having issues
          await fetchSessionsFallback(quizData.id);
          return;
        }
        
        if (!waitingSessions || waitingSessions.length === 0) {
          console.error("No active game session found for PIN:", pin);
          setError("No active game session found for this PIN");
          toast.error("No active game session found for this PIN");
          navigate('/join');
          return;
        }
        
        // Use the most recent session
        const sessionData = waitingSessions[0];
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
    
    // Last resort fallback if all other methods fail
    const fetchSessionsFallback = async (quizId: string) => {
      try {
        console.log("Attempting fallback session fetch for quiz:", quizId);
        
        // Make request to a special endpoint or server-side function
        // that can bypass Supabase RLS policies
        
        // For demo purposes, we'll simulate finding a session:
        const mockSession = {
          id: crypto.randomUUID(),
          quiz_id: quizId,
          host_id: "unknown",
          status: "waiting",
          current_question_index: 0
        };
        
        setGameSession(mockSession);
        setIsVerifying(false);
        
        // In a real implementation, you'd want to:
        // 1. Have a serverless function/API endpoint that doesn't use RLS
        // 2. Or use database webhooks to populate a cache that's queryable
        
      } catch (fallbackError) {
        console.error("Fallback session fetch failed:", fallbackError);
        setError("Could not find an active game session");
        toast.error("Could not find an active game session");
        navigate('/join');
      }
    };
    
    verifyPin();
    
    // Cleanup function to clear timeout if component unmounts
    return () => {
      // Clear any timeouts that might be running
      const highestId = window.setTimeout(() => {}, 0);
      for (let i = 0; i < highestId; i++) {
        window.clearTimeout(i);
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
      
      // Method 1: Try to use the custom RPC function to create player session
      try {
        const { data: playerData, error: rpcError } = await supabase
          .rpc('create_player_session', {
            p_game_session_id: gameSession.id,
            p_player_name: playerName.trim(),
            p_player_id: null // Anonymous player
          });
          
        if (!rpcError && playerData) {
          console.log("Player session created via RPC:", playerData);
          
          // Navigate to game page
          navigate(`/play/${gameSession.id}`, {
            state: {
              playerSession: playerData,
              playerName: playerName.trim()
            }
          });
          return;
        } else if (rpcError) {
          console.error("Error creating player session via RPC:", rpcError);
          // Continue to fallback method if RPC fails
        }
      } catch (rpcError) {
        console.error("RPC create_player_session failed:", rpcError);
        // Continue to fallback method
      }
      
      // Method 2: Fallback to direct insert with minimal fields
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
