
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import MainLayout from "@/layouts/MainLayout";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

const JoinWithPin = () => {
  const { pin } = useParams<{ pin: string }>();
  const { user } = useAuth();
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setPlayerName(user.first_name || user.username || "");
    }
    
    // Verify if the game pin exists
    const checkGamePin = async () => {
      try {
        setIsLoading(true);
        
        if (!pin) {
          setError("No game PIN provided");
          return;
        }
        
        console.log("Checking game PIN:", pin);
        
        const { data, error: pinError } = await supabase
          .from('quizzes')
          .select('id')
          .eq('game_pin', pin)
          .maybeSingle();
        
        if (pinError) {
          console.error("Error checking game PIN:", pinError);
          setError("Error verifying game PIN");
          return;
        }
        
        if (!data) {
          console.log("No quiz found with PIN:", pin);
          setError("Invalid game PIN. No active game found with this PIN.");
          return;
        }
        
        console.log("Valid game PIN found, quiz ID:", data.id);
        // PIN is valid, ready to join
        setError(null);
      } catch (err) {
        console.error("Error:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkGamePin();
  }, [pin, user]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin) {
      toast.error("Game PIN required");
      return;
    }

    if (!playerName) {
      toast.error("Name required");
      return;
    }
    
    setIsJoining(true);
    
    try {
      console.log("Joining game with PIN:", pin);
      
      // Find the quiz with this game pin
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('game_pin', pin)
        .maybeSingle();
      
      if (quizError || !quizData) {
        console.error("Error finding quiz:", quizError);
        throw new Error("Invalid game PIN. Please check and try again.");
      }
      
      console.log("Found quiz with ID:", quizData.id);
      
      // Find an active game session for this quiz
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('quiz_id', quizData.id)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (sessionError) {
        console.error("Error finding game session:", sessionError);
        throw new Error("Error finding active game. Please try again.");
      }
      
      if (!sessionData) {
        console.error("No active game session found for quiz:", quizData.id);
        throw new Error("No active game found with this PIN. The game may have ended or not started yet.");
      }
      
      console.log("Found game session with ID:", sessionData.id);
      
      // Check if player already exists in this session
      if (user) {
        const { data: existingPlayer } = await supabase
          .from('player_sessions')
          .select('id')
          .eq('game_session_id', sessionData.id)
          .eq('player_id', user.id)
          .maybeSingle();
        
        if (existingPlayer) {
          console.log("Player already exists in session:", existingPlayer.id);
          navigate(`/play/${sessionData.id}`, { 
            state: { 
              playerSession: existingPlayer,
              playerName: playerName
            } 
          });
          return;
        }
      }
      
      // Create a player session
      const { data: playerSession, error: playerError } = await supabase
        .from('player_sessions')
        .insert({
          game_session_id: sessionData.id,
          player_id: user?.id || null,
          player_name: playerName,
          score: 0,
          answers: []
        })
        .select()
        .single();
      
      if (playerError) {
        console.error("Error creating player session:", playerError);
        throw new Error("Failed to join the game. Please try again.");
      }
      
      console.log("Created player session:", playerSession.id);
      
      // Navigate to the game lobby
      navigate(`/play/${sessionData.id}`, { 
        state: { 
          playerSession: playerSession,
          playerName: playerName
        } 
      });
      
    } catch (error: any) {
      console.error("Join error:", error);
      toast.error("Failed to join game", {
        description: error.message || "Something went wrong. Please try again."
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto pt-8 pb-20 px-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Error</h1>
            <p className="text-rose-500 mb-6">{error}</p>
            <Button asChild>
              <a href="/join">Try Another Game PIN</a>
            </Button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Join Game</h1>
              <p className="text-lg text-brainblitz-dark-gray">
                You're joining a game with PIN: <span className="font-semibold">{pin}</span>
              </p>
            </div>
            
            <form onSubmit={handleJoinGame} className="space-y-6">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium mb-2">
                  Your Name
                </label>
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                  placeholder="Enter your display name"
                  required
                  autoFocus
                />
              </div>
              
              <Button 
                type="submit" 
                size="lg"
                className="w-full py-6 text-lg font-semibold"
                disabled={isJoining || !playerName}
              >
                {isJoining ? (
                  <div className="flex items-center justify-center">
                    <Spinner color="white" size="sm" className="mr-2" />
                    <span>Joining...</span>
                  </div>
                ) : (
                  "Join Game"
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default JoinWithPin;
