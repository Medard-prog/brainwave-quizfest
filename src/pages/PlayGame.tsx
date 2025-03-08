
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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [gamePin, setGamePin] = useState<string | null>(null);
  
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
        .select('id, title, description, creator_id, time_limit, shuffle_questions, is_public, game_pin, created_at, updated_at')
        .eq('id', quizId)
        .single();
      
      if (quizError) {
        console.error("Polling: Error fetching quiz:", quizError);
        return;
      }
      
      console.log("Polling: Quiz data updated:", quizData);
      // Make sure we have a complete Quiz object with all required properties
      setQuiz(quizData as Quiz);
      
      // Save the game pin if available
      if (quizData.game_pin) {
        setGamePin(quizData.game_pin);
      }
    } catch (error) {
      console.error("Polling: Error in fetchQuizData:", error);
    }
  };
  
  // Fetch the list of other players in this game session
  const fetchPlayers = async () => {
    if (!sessionId || !playerSession) return;
    
    try {
      console.log("Polling: Fetching players for session:", sessionId);
      
      // Try using the RPC function first for more reliable data
      try {
        const { data: playersData, error: rpcError } = await supabase
          .rpc('get_player_sessions_for_game', { p_game_session_id: sessionId });
          
        if (!rpcError && playersData) {
          console.log("Players fetched via RPC:", playersData.length, "players");
          // Filter out the current player
          const others = playersData.filter(player => player.id !== playerSession.id) as PlayerSession[];
          setOtherPlayers(others);
          return;
        } else if (rpcError) {
          console.error("RPC error fetching players:", rpcError);
        }
      } catch (rpcError) {
        console.error("RPC method failed:", rpcError);
      }
      
      // Fallback to direct query if RPC fails
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
      
      // First try the direct query approach for reliability
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
        setSelectedAnswer(null);
        setHasAnswered(false);
      } else {
        console.error("Question index out of range:", questionIndex, "total questions:", questionsData?.length);
        
        // Fallback to RPC if direct query doesn't work
        try {
          const { data: rpcData, error: functionError } = await supabase
            .rpc('get_quiz_questions', { quiz_id: quiz.id });
            
          if (!functionError && rpcData && rpcData.length > questionIndex) {
            console.log("Questions from RPC:", rpcData);
            setCurrentQuestion(rpcData[questionIndex]);
            setSelectedAnswer(null);
            setHasAnswered(false);
          } else {
            console.error("Error or no data from RPC:", functionError);
          }
        } catch (rpcError) {
          console.error("Error using get_quiz_questions RPC:", rpcError);
        }
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
  
  // Check if the player has already answered the current question
  useEffect(() => {
    if (!playerSession || !currentQuestion) return;
    
    const playerAnswers = playerSession.answers || [];
    const hasAnsweredCurrent = playerAnswers.some(a => a.question_id === currentQuestion.id);
    
    if (hasAnsweredCurrent) {
      setHasAnswered(true);
      setSelectedAnswer(playerAnswers.find(a => a.question_id === currentQuestion.id)?.answer || null);
    } else {
      setHasAnswered(false);
      setSelectedAnswer(null);
    }
  }, [currentQuestion, playerSession]);

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
      const isCorrect = answer === currentQuestion.correct_answer;
      
      if (isCorrect) {
        newScore += currentQuestion.points || 10;
      }
      
      // Create new answer object
      const newAnswer = {
        question_id: currentQuestion.id,
        answer: answer,
        is_correct: isCorrect,
        points: isCorrect ? (currentQuestion.points || 10) : 0,
        timestamp: new Date().toISOString()
      };
      
      // Update answers array
      const newAnswers = [
        ...(playerData.answers || []),
        newAnswer
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
        toast.error("Failed to submit answer. Please try again.");
      } else {
        // Update local player session with new data
        setPlayerSession({
          ...playerSession,
          answers: newAnswers,
          score: newScore
        });
        
        if (isCorrect) {
          toast.success(`Correct! +${currentQuestion.points || 10} points`);
        } else {
          toast.error("Incorrect answer");
        }
      }
      
    } catch (error) {
      console.error("Error in submitAnswer:", error);
      toast.error("An error occurred while submitting your answer");
    }
  };
  
  // Helper function to extract answer text from multiple choice options
  const getAnswerText = (optionId: string, options: any[]) => {
    if (!options) return optionId;
    const option = options.find(opt => opt.id === optionId || opt.text === optionId);
    return option ? option.text : optionId;
  };

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
                      key={option.id || index}
                      onClick={() => !hasAnswered && submitAnswer(option.id || option.text)}
                      disabled={hasAnswered}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedAnswer === option.id || selectedAnswer === option.text
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
