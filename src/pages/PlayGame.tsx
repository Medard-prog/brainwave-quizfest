
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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [gamePin, setGamePin] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Fetch the list of other players in this game session
  const fetchPlayers = async () => {
    if (!sessionId || !playerSession) return;
    
    try {
      console.log("Fetching players for session:", sessionId);
      
      // Only select the fields we need to avoid RLS recursion
      const { data: playersData, error: playersError } = await supabase
        .from('player_sessions')
        .select('id, player_name, score, created_at, game_session_id, answers, updated_at')
        .eq('game_session_id', sessionId);
      
      if (playersError) {
        console.error("Error fetching players:", playersError);
        return;
      }
      
      if (playersData) {
        console.log("Players data:", playersData);
        // Filter out the current player and cast to PlayerSession[]
        const others = playersData.filter(player => player.id !== playerSession.id) as PlayerSession[];
        setOtherPlayers(others);
      }
    } catch (error) {
      console.error("Error in fetchPlayers:", error);
    }
  };
  
  // Fetch the current question based on index
  const fetchCurrentQuestion = async (questionIndex: number) => {
    if (!sessionId || !quiz) return;
    
    try {
      console.log("Fetching question at index:", questionIndex);
      
      // Try to use the get_quiz_questions function first
      try {
        const { data: questionsData, error: functionError } = await supabase
          .rpc('get_quiz_questions', { quiz_id: quiz.id });
          
        if (!functionError && questionsData && questionsData.length > questionIndex) {
          console.log("Questions from RPC:", questionsData);
          setCurrentQuestion(questionsData[questionIndex]);
          return;
        }
      } catch (rpcError) {
        console.error("Error using get_quiz_questions RPC:", rpcError);
      }
      
      // Fallback to direct query
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_num', { ascending: true });
      
      if (questionsError) {
        console.error("Error fetching questions:", questionsError);
        return;
      }
      
      if (questionsData && questionsData.length > questionIndex) {
        console.log("Setting current question:", questionsData[questionIndex]);
        setCurrentQuestion(questionsData[questionIndex]);
      } else {
        console.error("Question index out of range:", questionIndex, "total questions:", questionsData?.length);
      }
    } catch (error) {
      console.error("Error in fetchCurrentQuestion:", error);
    }
  };

  // Periodic refresh for players and game state
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setRefreshKey(prevKey => prevKey + 1);
    }, 3000); // Refresh every 3 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Trigger refresh of data when refreshKey changes
  useEffect(() => {
    if (gameSession) {
      fetchPlayers();
      if (gameSession.status === 'active' && gameSession.current_question_index !== null) {
        fetchCurrentQuestion(gameSession.current_question_index);
      }
    }
  }, [refreshKey, gameSession]);

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
        
        // Add a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.error("Game session fetch timeout");
          toast.error("Failed to load game data. Please try again.");
          navigate("/join");
        }, 10000); // 10 seconds timeout
        
        console.log("Fetching game session:", sessionId);
        
        // Method 1: Try to use an RPC if available
        let sessionData;
        try {
          // Check if session exists using RPC
          const { data: sessions, error: rpcError } = await supabase
            .rpc('get_game_session_details', { session_id: sessionId });
            
          if (!rpcError && sessions && sessions.length > 0) {
            sessionData = sessions[0];
            console.log("Game session found via RPC:", sessionData);
          }
        } catch (rpcError) {
          console.error("RPC method not available, trying alternative approach:", rpcError);
        }
        
        // Method 2: Direct query but be specific to avoid RLS recursion
        if (!sessionData) {
          const { data: gameData, error: gameError } = await supabase
            .from('game_sessions')
            .select('id, quiz_id, host_id, status, current_question_index')
            .eq('id', sessionId)
            .single();
            
          if (gameError) {
            clearTimeout(timeoutId);
            console.error("Error fetching game session:", gameError);
            toast.error("Failed to load game data");
            navigate("/join");
            return;
          }
          
          if (!gameData) {
            clearTimeout(timeoutId);
            console.error("Game session not found:", sessionId);
            toast.error("Game session not found");
            navigate("/join");
            return;
          }
          
          // Fetch the quiz info separately
          const { data: quizData, error: quizError } = await supabase
            .from('quizzes')
            .select('id, title, description, creator_id, game_pin')
            .eq('id', gameData.quiz_id)
            .single();
            
          if (quizError) {
            clearTimeout(timeoutId);
            console.error("Error fetching quiz data:", quizError);
            toast.error("Failed to load quiz data");
            navigate("/join");
            return;
          }
          
          // Combine the data
          sessionData = {
            ...gameData,
            quiz: quizData
          };
          
          // Save the game pin
          if (quizData.game_pin) {
            setGamePin(quizData.game_pin);
          }
        }
        
        // Clear the timeout since we received a response
        clearTimeout(timeoutId);
        
        console.log("Game session loaded:", sessionData);
        setGameSession(sessionData);
        setQuiz(sessionData.quiz);
        setGameStatus(sessionData.status);
        
        // Set up realtime subscription for game updates
        const gameChannel = supabase
          .channel(`game_${sessionId}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_sessions',
            filter: `id=eq.${sessionId}`
          }, (payload) => {
            console.log("Game session updated:", payload);
            const updatedSession = payload.new;
            setGameSession(current => ({
              ...current,
              ...updatedSession
            }));
            setGameStatus(updatedSession.status);
            
            // If there's a current question index change, fetch the question
            if (updatedSession.current_question_index !== gameSession?.current_question_index) {
              fetchCurrentQuestion(updatedSession.current_question_index || 0);
              setHasAnswered(false);
              setSelectedAnswer(null);
            }
          })
          .subscribe((status) => {
            console.log("Game channel subscription status:", status);
          });
        
        // Set up realtime subscription for player updates
        const playersChannel = supabase
          .channel(`players_${sessionId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'player_sessions',
            filter: `game_session_id=eq.${sessionId}`
          }, () => {
            fetchPlayers();
          })
          .subscribe((status) => {
            console.log("Players channel subscription status:", status);
          });
        
        // Fetch initial players
        fetchPlayers();
        
        // If the game is already active, fetch the current question
        if (sessionData.status === 'active' && sessionData.current_question_index !== null) {
          fetchCurrentQuestion(sessionData.current_question_index);
        }
        
        // Cleanup function
        return () => {
          supabase.removeChannel(gameChannel);
          supabase.removeChannel(playersChannel);
        };
        
      } catch (error) {
        console.error("Error in initializeGame:", error);
        toast.error("An error occurred while loading the game");
        navigate("/join");
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeGame();
  }, [sessionId, location, navigate]);

  const submitAnswer = async (answer: string) => {
    if (!playerSession || !currentQuestion || hasAnswered) return;
    
    setSelectedAnswer(answer);
    setHasAnswered(true);
    
    try {
      // Get current answers array
      const { data: playerData, error: fetchError } = await supabase
        .from('player_sessions')
        .select('answers, score')
        .eq('id', playerSession.id)
        .single();
        
      if (fetchError) {
        console.error("Error fetching player data:", fetchError);
        return;
      }
      
      // Calculate score
      let newScore = playerData.score || 0;
      if (answer === currentQuestion.correct_answer) {
        newScore += currentQuestion.points || 10;
      }
      
      // Update answers array
      const newAnswers = [
        ...(playerData.answers || []),
        {
          question_id: currentQuestion.id,
          answer: answer,
          is_correct: answer === currentQuestion.correct_answer,
          points: answer === currentQuestion.correct_answer ? (currentQuestion.points || 10) : 0,
          timestamp: new Date().toISOString()
        }
      ];
      
      // Update player session
      const { error: updateError } = await supabase
        .from('player_sessions')
        .update({
          answers: newAnswers,
          score: newScore
        })
        .eq('id', playerSession.id);
        
      if (updateError) {
        console.error("Error updating player answers:", updateError);
      }
      
    } catch (error) {
      console.error("Error in submitAnswer:", error);
    }
  };

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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              {gameStatus === "waiting" ? "Waiting for game to start" : 
               gameStatus === "active" ? "Game in progress" :
               "Game has ended"}
            </h1>
            {gamePin && (
              <div className="bg-brainblitz-primary/10 px-4 py-2 rounded-lg">
                <span className="text-sm text-brainblitz-dark-gray">Game PIN:</span>
                <span className="ml-2 font-bold">{gamePin}</span>
              </div>
            )}
          </div>
          
          {quiz && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{quiz.title}</h2>
              {quiz.description && (
                <p className="text-brainblitz-dark-gray mt-1">{quiz.description}</p>
              )}
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="font-semibold mb-2">Players in the game: {otherPlayers.length + 1}</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {playerName} (You)
              </span>
              {otherPlayers.map(player => (
                <span key={player.id} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                  {player.player_name}
                </span>
              ))}
            </div>
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
          ) : gameStatus === "active" && currentQuestion ? (
            <div className="border-t border-gray-200 mt-6 pt-6">
              <div className="mb-4">
                <span className="bg-brainblitz-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                  Question {(gameSession?.current_question_index || 0) + 1}
                </span>
                <span className="ml-3 text-sm text-brainblitz-dark-gray">
                  {currentQuestion.points} points
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-6">{currentQuestion.question_text}</h3>
              
              <div className="space-y-3">
                {currentQuestion.question_type === 'multiple_choice' && 
                  currentQuestion.options && 
                  currentQuestion.options.map((option: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => !hasAnswered && submitAnswer(option.text)}
                      disabled={hasAnswered}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedAnswer === option.text 
                          ? 'border-brainblitz-primary bg-brainblitz-primary/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {option.text}
                    </button>
                  ))
                }
                
                {(currentQuestion.correct_answer === "True" || currentQuestion.correct_answer === "False") && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => !hasAnswered && submitAnswer("True")}
                      disabled={hasAnswered}
                      className={`p-4 rounded-lg border-2 text-center ${
                        selectedAnswer === "True" 
                          ? 'border-brainblitz-primary bg-brainblitz-primary/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      True
                    </button>
                    <button
                      onClick={() => !hasAnswered && submitAnswer("False")}
                      disabled={hasAnswered}
                      className={`p-4 rounded-lg border-2 text-center ${
                        selectedAnswer === "False" 
                          ? 'border-brainblitz-primary bg-brainblitz-primary/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      False
                    </button>
                  </div>
                )}
              </div>
              
              {hasAnswered && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="font-medium">Your answer has been submitted</p>
                  <p className="text-sm text-brainblitz-dark-gray mt-1">
                    Waiting for other players and the next question...
                  </p>
                </div>
              )}
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
