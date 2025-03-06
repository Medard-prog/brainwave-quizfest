
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import MainLayout from "@/layouts/MainLayout";
import { useAuth } from "@/context/AuthContext";

const Join = () => {
  const [gamePin, setGamePin] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Pre-populate player name if user is logged in
  useState(() => {
    if (user) {
      setPlayerName(user.first_name || user.username || "");
    }
  });

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gamePin) {
      toast({
        title: "Game PIN required",
        description: "Please enter a valid Game PIN to join",
        variant: "destructive",
      });
      return;
    }

    if (!playerName) {
      toast({
        title: "Name required",
        description: "Please enter your name to join the game",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Find the quiz with this game pin
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id')
        .eq('game_pin', gamePin)
        .single();
      
      if (quizError || !quizData) {
        throw new Error("Invalid game PIN. Please check and try again.");
      }
      
      // Find an active game session for this quiz
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('quiz_id', quizData.id)
        .eq('status', 'waiting')
        .single();
      
      if (sessionError || !sessionData) {
        throw new Error("No active game found with this PIN. The game may have ended or not started yet.");
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
      
      if (playerError || !playerSession) {
        throw new Error("Failed to join the game. Please try again.");
      }
      
      // Navigate to the game lobby
      navigate(`/lobby/${sessionData.id}`, { 
        state: { 
          playerSession: playerSession,
          playerName: playerName
        } 
      });
      
    } catch (error: any) {
      toast({
        title: "Failed to join game",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle digit input
  const handleDigitInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;
    
    const newPin = gamePin.split('');
    newPin[index] = value;
    setGamePin(newPin.join(''));
    
    // Auto focus to next input if value is entered
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (index > 0 && !gamePin[index]) {
        const prevInput = document.getElementById(`pin-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
        }
      }
      
      const newPin = gamePin.split('');
      newPin[index] = '';
      setGamePin(newPin.join(''));
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto pt-8 pb-20 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join a Game</h1>
          <p className="text-brainblitz-dark-gray text-lg">
            Enter the 6-digit Game PIN provided by your host
          </p>
        </div>
        
        <form onSubmit={handleJoinGame} className="space-y-10">
          <div className="space-y-8">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="text"
                  maxLength={1}
                  value={gamePin[index] || ''}
                  onChange={(e) => handleDigitInput(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-16 sm:w-16 sm:h-20 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-brainblitz-primary focus:ring-2 focus:ring-brainblitz-primary"
                  required
                />
              ))}
            </div>
            
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
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            size="lg"
            className="w-full py-6 text-lg font-semibold"
            disabled={isLoading || gamePin.length !== 6 || !playerName}
          >
            {isLoading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
            ) : (
              "Join Game"
            )}
          </Button>
        </form>
        
        <div className="mt-10 text-center">
          <p className="text-brainblitz-dark-gray">
            Want to create your own quiz?{" "}
            <a href="/register" className="text-brainblitz-primary font-semibold hover:underline">
              Sign up
            </a>
            {" "}or{" "}
            <a href="/login" className="text-brainblitz-primary font-semibold hover:underline">
              log in
            </a>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Join;
