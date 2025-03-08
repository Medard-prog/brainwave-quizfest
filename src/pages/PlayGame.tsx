import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import MainLayout from "@/layouts/MainLayout";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { GameSession, PlayerSession, Quiz, Question } from "@/lib/types";
import { usePolling } from "@/utils/polling";

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
  
  // Fetch the current game session details
  const fetchGameSession = async () => {
    if (!sessionId) return;
    
    try {
      console.log("Polling: Fetching game session data...");
      
      // Method 1: Try RPC function first
      try {
        const { data: sessionData, error: rpcError } = await supabase
          .rpc('get_game_session_details', { session_id: sessionId });
          
        if (!rpcError && sessionData && sessionData.length > 0) {
          console.log("Polling: Game session updated via RPC:", sessionData[0]);
          const newSession = sessionData[0];
          
          // Check if status changed
          if (gameSession && gameSession.status !== newSession.status) {
            console.log(`Polling: Game status changed from ${gameSession.status} to ${newSession.status}`);
          }
          
          // Check if question index changed
          if (gameSession && gameSession.current_question_index !== newSession.current_question_index) {
            console.log(`Polling: Question index changed from ${gameSession.current_question_index} to ${newSession.current_question_index}`);
            fetchCurrentQuestion(newSession.current_question_index);
          }
          
          setGameSession(newSession);
          setGameStatus(newSession.status);
          return;
        }
      } catch (e) {
        console.error("Polling: RPC fetch failed:", e);
      }
      
      // Method 2: Direct query
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select('id, quiz_id, host_id, status, current_question_index, started_at, ended_at, created_at, updated_at')
        .eq('id', sessionId)
        .single();
      
      if (sessionError) {
        console.error("Polling: Error fetching game session:", sessionError);
        return;
      }
      
      if (!sessionData) {
        console.error("Polling: Game session not found");
        return;
      }
      
      console.log("Polling: Game session updated:", sessionData);
      
      if (gameSession && gameSession.status !== sessionData.status) {
        console.log(`Polling: Game status changed from ${gameSession.status} to ${sessionData.status}`);
      }
      
      if (gameSession && gameSession.current_question_index !== sessionData.current_question_index) {
        console.log(`Polling: Question index changed from ${gameSession.current_question_index} to ${sessionData.current_question_index}`);
        fetchCurrentQuestion(sessionData.current_question_index);
      }
      
      setGameSession(sessionData as unknown as GameSession);
      setGameStatus(sessionData.status);
      
      // If we didn't have quiz data before, fetch it
      if (!quiz && sessionData.quiz_id) {
        fetchQuizData(sessionData.quiz_id);
      }
    } catch (error) {
      console.error("Polling: Error in fetchGameSession:", error);
    }
  };
  
  // Fetch quiz details
  const fetchQuizData = async (quizId: string) => {
    try {
      console.log("Polling: Fetching quiz data for:", quizId);
      
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id, title, description, creator_id, time_limit, shuffle_questions')
        .eq('id', quizId)
        .single();
      
      if (quizError) {
        console.error("Polling: Error fetching quiz:", quizError);
        return;
      }
      
      console.log("Polling: Quiz data updated:", quizData);
      setQuiz(quizData as unknown as Quiz);
    } catch (error) {
      console.error("Polling: Error in fetchQuizData:", error);
    }
  };
  
  // Fetch the list of other players in this game session
  const fetchPlayers = async () => {
    if (!sessionId || !playerSession) return;
    
    try {
      console.log("Polling: Fetching players for session:", sessionId);
      
      // Try RPC function first
      try {
        const { data: playersData, error: rpcError } = await supabase
          .rpc('get_player_sessions_for_game', { p_game_session_id: sessionId });
          
        if (!rpcError && playersData) {
          console.log("Polling: Players data fetched via RPC:", playersData.length, "players");
          const others = playersData.filter(player => player.id !== playerSession.id) as PlayerSession[];
          setOtherPlayers(others);
          return;
        }
      } catch (e) {
        console.error("Polling: RPC player fetch failed:", e);
      }
      
      // Fallback to direct query
      const { data: playersData, error: playersError } = await supabase
        .from('player_sessions')
        .select('id, player_name, score, created_at, game_session_id, answers, updated_at, player_id')
        .eq('game_session_id', sessionId);
      
      if (playersError) {
        console.error("Polling: Error fetching players:", playersError);
        return;
      }
      
      if (playersData) {
        console.log("Polling: Players data updated:", playersData.length, "players");
        // Filter out the current player and cast to PlayerSession[]
        const others = playersData.filter(player => player.id !== playerSession.id) as PlayerSession[];
        setOtherPlayers(others);
      }
    } catch (error) {
      console.error("Polling: Error in fetchPlayers:", error);
    }
  };
  
  // Fetch the current question based on index
  const fetchCurrentQuestion = async (questionIndex: number) => {
    if (!sessionId || !quiz) return;
    
    try {
      console.log("Polling: Fetching question at index:", questionIndex);
      
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_num', { ascending: true });
      
      if (questionsError) {
        console.error("Polling: Error fetching questions:", questionsError);
        return;
      }
      
      if (questionsData && questionsData.length > questionIndex) {
        console.log("Polling: Current question updated:", questionsData[questionIndex]);
        setCurrentQuestion(questionsData[questionIndex]);
      } else {
        console.error("Polling: Question index out of range:", questionIndex, "total questions:", questionsData?.length);
      }
    } catch (error) {
      console.error("Polling: Error in fetchCurrentQuestion:", error);
    }
  };
  
  // Poll for updates every second
  const { isPolling, error: pollingError } = usePolling(async () => {
    await fetchGameSession();
    await fetchPlayers();
    // The current question is fetched when the question index changes
  }, 1000);
  
  // Initial setup on component mount
  useEffect(() => {
    if (!sessionId) return;
    
    const initializeGame = async () => {
      try {
        setIsLoading(true);
        
        const playerSessionData = location.state?.playerSession;
        const playerNameData = location.state?.playerName || "";
        
        console.log("Initial player session from state:", playerSessionData);
        console.log("Initial player name from state:", playerNameData);
        
        if (!playerSessionData) {
          console.error("No player session data in location state");
          toast.error("Session data missing. Please rejoin the game.");
          navigate("/join");
          return;
        }
        
        setPlayerSession(playerSessionData);
        setPlayerName(playerNameData);
        
        // Initial data fetching is handled by the polling hook
      } catch (error) {
        console.error("Error in initializeGame:", error);
        toast.error("An error occurred while loading the game");
        navigate("/join");
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeGame();
    
    // The polling cleanup is handled by the usePolling hook
  }, [sessionId, location, navigate]);
  
  // Log polling errors
  useEffect(() => {
    if (pollingError) {
      console.error("Polling error:", pollingError);
    }
  }, [pollingError]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <Spinner size="lg" className="mb-4" />
            <h2 className="text-2xl font-bold mb-2">Loading Game</h2>
            <p className="text-brainblitz-dark-gray">Please wait...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 max-w-4xl mx-auto">
        {/* Game session information */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{quiz?.title || "Game"}</h1>
          <p className="text-brainblitz-dark-gray mb-4">{quiz?.description || "No description"}</p>
          
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="font-medium">Status: <span className="font-bold capitalize">{gameStatus}</span></p>
            <p className="font-medium">Your name: <span className="font-bold">{playerName}</span></p>
            <p className="font-medium">Other players: <span className="font-bold">{otherPlayers.length}</span></p>
          </div>
        </div>
        
        {/* Player list */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Players</h2>
          {otherPlayers.length > 0 ? (
            <ul className="space-y-2">
              {otherPlayers.map(player => (
                <li key={player.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium">{player.player_name}</span>
                  <span className="bg-brainblitz-primary text-white px-2 py-1 rounded">{player.score || 0}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-brainblitz-dark-gray text-center py-4">No other players have joined yet</p>
          )}
        </div>
        
        {/* Current question section - only show if game is active */}
        {gameStatus === "active" && currentQuestion && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Current Question</h2>
            <p className="text-lg mb-4">{currentQuestion.question_text}</p>
            
            {/* Options for multiple choice */}
            {currentQuestion.question_type === "multiple_choice" && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-3 bg-gray-100 hover:bg-brainblitz-primary hover:text-white rounded-lg transition"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Waiting screen */}
        {gameStatus === "waiting" && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Waiting for host to start the game</h2>
            <Spinner className="mx-auto" />
          </div>
        )}
        
        {/* Game over screen */}
        {gameStatus === "completed" && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Game Over</h2>
            <p className="mb-4">Thank you for playing!</p>
            <Button onClick={() => navigate("/join")}>Join Another Game</Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PlayGame;
