import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import MainLayout from "@/layouts/MainLayout";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { GameSession, PlayerSession, Quiz, Question } from "@/lib/types";

const PlayGame = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [playerSession, setPlayerSession] = useState<PlayerSession | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [gameStatus, setGameStatus] = useState<"waiting" | "active" | "completed">("waiting");
  const [otherPlayers, setOtherPlayers] = useState<PlayerSession[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  
  useEffect(() => {
    if (!sessionId) return;
    
    const initializeGame = async () => {
      try {
        setIsLoading(true);
        
        let playerSessionData = location.state?.playerSession;
        let playerNameData = location.state?.playerName || "";
        
        console.log("Initial player session from state:", playerSessionData);
        console.log("Initial player name from state:", playerNameData);
        
        if (!playerSessionData) {
          navigate("/join");
          return;
        }
        
        setPlayerSession(playerSessionData);
        setPlayerName(playerNameData);
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('game_sessions')
          .select('*, quiz:quiz_id(*)')
          .eq('id', sessionId)
          .maybeSingle();
        
        if (sessionError || !sessionData) {
          console.error("Error fetching game session:", sessionError);
          toast.error("Game not found or has ended");
          navigate("/join");
          return;
        }
        
        console.log("Game session data:", sessionData);
        setGameSession(sessionData);
        setQuiz(sessionData.quiz);
        setGameStatus(sessionData.status);
        
        const { data: playersData, error: playersError } = await supabase
          .from('player_sessions')
          .select('*')
          .eq('game_session_id', sessionId);
        
        if (!playersError && playersData) {
          const others = playersData.filter(player => player.id !== playerSessionData.id);
          setOtherPlayers(others);
        }
        
      } catch (error) {
        console.error("Error initializing game:", error);
        toast.error("Failed to join game");
        navigate("/join");
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeGame();
    
    const gameSubscription = supabase
      .channel('game_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`,
      }, (payload) => {
        console.log("Game session updated:", payload);
        const updatedSession = payload.new as GameSession;
        setGameSession(prevSession => ({
          ...prevSession!,
          ...updatedSession
        }));
        setGameStatus(updatedSession.status);
      })
      .subscribe();
    
    const playerSubscription = supabase
      .channel('player_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'player_sessions',
        filter: `game_session_id=eq.${sessionId}`,
      }, (payload) => {
        console.log("New player joined:", payload);
        const newPlayer = payload.new as PlayerSession;
        
        if (newPlayer.id !== playerSession?.id) {
          setOtherPlayers(prev => [...prev, newPlayer]);
        }
      })
      .subscribe();
    
    return () => {
      gameSubscription.unsubscribe();
      playerSubscription.unsubscribe();
    };
  }, [sessionId, location.state, navigate, playerSession?.id]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold mb-2">
            {gameStatus === "waiting" ? "Waiting for game to start" : 
             gameStatus === "active" ? "Game in progress" :
             "Game has ended"}
          </h1>
          
          {quiz && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{quiz.title}</h2>
              {quiz.description && (
                <p className="text-brainblitz-dark-gray mt-1">{quiz.description}</p>
              )}
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="font-semibold mb-2">Players in the game:</h3>
            <ul className="space-y-1">
              <li className="font-medium text-green-600">{playerName} (You)</li>
              {otherPlayers.map(player => (
                <li key={player.id} className="text-brainblitz-dark-gray">
                  {player.player_name}
                </li>
              ))}
            </ul>
          </div>
          
          {gameStatus === "waiting" ? (
            <div className="border-t border-gray-200 mt-6 pt-6 text-center">
              <div className="animate-pulse flex flex-col items-center">
                <Spinner size="lg" className="mb-4" />
                <p className="text-lg font-medium">Waiting for the host to start the game...</p>
                <p className="text-sm text-brainblitz-dark-gray mt-2">
                  The game will begin automatically when the host starts it
                </p>
              </div>
            </div>
          ) : gameStatus === "completed" ? (
            <div className="border-t border-gray-200 mt-6 pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Game has ended</h2>
              <p className="mb-4">Thanks for playing!</p>
              <Button asChild>
                <a href="/join">Join Another Game</a>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </MainLayout>
  );
};

export default PlayGame;
