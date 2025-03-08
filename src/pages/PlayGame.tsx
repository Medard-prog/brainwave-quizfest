import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import MainLayout from "@/layouts/MainLayout";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { GameSession, PlayerSession, Quiz, Question } from "@/lib/types";
import { usePolling } from "@/utils/polling";
import { CheckCircle, Clock } from "lucide-react";

// Define interface for player answers
interface PlayerAnswer {
  question_id: string;
  answer: string;
  correct: boolean;
  question_index: number;
  timestamp: string;
}

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
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [previousQuestionIndex, setPreviousQuestionIndex] = useState<number | null>(null);
  
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
          
          // Check if status changed from waiting to active
          if (gameSession && gameSession.status !== newSession.status) {
            console.log(`Polling: Game status changed from ${gameSession.status} to ${newSession.status}`);
            
            // If game just started, force a question refresh
            if (gameSession.status === 'waiting' && newSession.status === 'active') {
              console.log("Polling: Game just started! Fetching current question...");
              fetchCurrentQuestion(newSession.current_question_index || 0);
              // Reset answer state when game starts
              setHasAnswered(false);
              setSelectedAnswer(null);
            }
          }
          
          // Check if question index changed
          if (gameSession?.current_question_index !== newSession.current_question_index) {
            console.log(`Polling: Question index changed from ${gameSession?.current_question_index} to ${newSession.current_question_index}`);
            setPreviousQuestionIndex(gameSession?.current_question_index || null);
            fetchCurrentQuestion(newSession.current_question_index || 0);
            // Reset answer state for new question
            setHasAnswered(false);
            setSelectedAnswer(null);
          }
          
          setGameSession(newSession as unknown as GameSession);
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
      
      // Check if status changed from waiting to active
      if (gameSession && gameSession.status !== sessionData.status) {
        console.log(`Polling: Game status changed from ${gameSession.status} to ${sessionData.status}`);
        
        // If game just started, force a question refresh
        if (gameSession.status === 'waiting' && sessionData.status === 'active') {
          console.log("Polling: Game just started! Fetching current question...");
          fetchCurrentQuestion(sessionData.current_question_index || 0);
          // Reset answer state when game starts
          setHasAnswered(false);
          setSelectedAnswer(null);
        }
      }
      
      // Check if question index changed
      if (gameSession && gameSession.current_question_index !== sessionData.current_question_index) {
        console.log(`Polling: Question index changed from ${gameSession.current_question_index} to ${sessionData.current_question_index}`);
        setPreviousQuestionIndex(gameSession.current_question_index || null);
        fetchCurrentQuestion(sessionData.current_question_index || 0);
        // Reset answer state for new question
        setHasAnswered(false);
        setSelectedAnswer(null);
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
        .select('id, title, description, creator_id, time_limit, shuffle_questions, created_at, updated_at, is_public')
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
          
          // Update current player's info if available
          const mySession = playersData.find(p => p.id === playerSession.id);
          if (mySession) {
            setPlayerSession(mySession);
          }
          
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
        
        // Update current player's info if available
        const mySession = playersData.find(p => p.id === playerSession.id);
        if (mySession) {
          setPlayerSession(mySession);
        }
        
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
    if (!sessionId || !gameSession?.quiz_id) return;
    
    try {
      console.log("Polling: Fetching question at index:", questionIndex);
      
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', gameSession.quiz_id)
        .order('order_num', { ascending: true });
      
      if (questionsError) {
        console.error("Polling: Error fetching questions:", questionsError);
        return;
      }
      
      if (questionsData && questionsData.length > questionIndex) {
        console.log("Polling: Current question updated:", questionsData[questionIndex]);
        setCurrentQuestion(questionsData[questionIndex]);
        
        // If this question has a time limit, start a countdown
        if (questionsData[questionIndex].time_limit) {
          setTimeLeft(questionsData[questionIndex].time_limit);
        }
      } else {
        console.error("Polling: Question index out of range:", questionIndex, "total questions:", questionsData?.length);
      }
    } catch (error) {
      console.error("Polling: Error in fetchCurrentQuestion:", error);
    }
  };
  
  // Submit an answer for the current question
  const submitAnswer = async (answerText: string) => {
    if (!playerSession || !currentQuestion || hasAnswered || !gameSession) return;
    
    try {
      setAnswerSubmitting(true);
      
      console.log("Submitting answer:", answerText, "for question:", currentQuestion.id);
      
      // Get the existing answers array
      let existingAnswers = playerSession.answers || [];
      if (!Array.isArray(existingAnswers)) {
        existingAnswers = [];
      }
      
      // Create a new answer object
      const newAnswer = {
        question_id: currentQuestion.id,
        answer: answerText,
        correct: answerText === currentQuestion.correct_answer,
        question_index: gameSession.current_question_index,
        timestamp: new Date().toISOString()
      };
      
      // Add the new answer
      const updatedAnswers = [...existingAnswers, newAnswer];
      
      // Calculate new score
      const isCorrect = answerText === currentQuestion.correct_answer;
      const pointsToAdd = isCorrect ? (currentQuestion.points || 10) : 0;
      const newScore = (playerSession.score || 0) + pointsToAdd;
      
      // Update player session with new answer and score
      const { error } = await supabase
        .from('player_sessions')
        .update({
          answers: updatedAnswers,
          score: newScore
        })
        .eq('id', playerSession.id);
      
      if (error) {
        console.error("Error submitting answer:", error);
        toast.error("Failed to submit answer");
        return;
      }
      
      // Update local state
      setPlayerSession({
        ...playerSession,
        answers: updatedAnswers,
        score: newScore
      });
      
      setHasAnswered(true);
      
      if (isCorrect) {
        toast.success("Correct answer! ✓");
      } else {
        toast.error("Incorrect answer ✗");
      }
      
      // Once submitted, check if all players have answered
      checkIfAllPlayersAnswered();
      
    } catch (error) {
      console.error("Error in submitAnswer:", error);
      toast.error("Failed to submit answer");
    } finally {
      setAnswerSubmitting(false);
    }
  };
  
  // Check if all players have answered the current question
  const checkIfAllPlayersAnswered = async () => {
    if (!sessionId || !gameSession || !currentQuestion) return;
    
    try {
      const { data: playersData, error: playersError } = await supabase
        .from('player_sessions')
        .select('id, answers')
        .eq('game_session_id', sessionId);
      
      if (playersError || !playersData) {
        console.error("Error checking player answers:", playersError);
        return;
      }
      
      // Check if all players have answered the current question
      const currentQuestionIndex = gameSession.current_question_index;
      const allAnswered = playersData.every(player => {
        const answers = player.answers || [];
        return answers.some((answer: PlayerAnswer) => 
          answer.question_index === currentQuestionIndex || 
          answer.question_id === currentQuestion.id
        );
      });
      
      if (allAnswered && playersData.length > 0) {
        console.log("All players have answered the current question!");
        
        // No need to do anything here - the host component will handle advancing
        // to the next question if auto-advance is enabled
      }
    } catch (error) {
      console.error("Error in checkIfAllPlayersAnswered:", error);
    }
  };
  
  // Poll for updates every second
  const { isPolling, error: pollingError } = usePolling(async () => {
    await fetchGameSession();
    await fetchPlayers();
    // The current question is fetched when the question index changes
  }, 1000);
  
  // Countdown timer for questions with time limits
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || hasAnswered || gameStatus !== 'active') return;
    
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Auto-submit when time runs out
    if (timeLeft === 0 && !hasAnswered && selectedAnswer) {
      submitAnswer(selectedAnswer);
    }
    
    return () => clearInterval(timerInterval);
  }, [timeLeft, hasAnswered, gameStatus, selectedAnswer]);
  
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
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-gray-100 rounded-lg p-3 flex-1">
              <p className="font-medium">Status: <span className="font-bold capitalize">{gameStatus}</span></p>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 flex-1">
              <p className="font-medium">Your score: <span className="font-bold">{playerSession?.score || 0}</span></p>
            </div>
            <div className="bg-gray-100 rounded-lg p-3 flex-1">
              <p className="font-medium">Players: <span className="font-bold">{otherPlayers.length + 1}</span></p>
            </div>
          </div>
        </div>
        
        {/* Current question section - only show if game is active */}
        {gameStatus === "active" && currentQuestion && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Current Question</h2>
              {timeLeft !== null && timeLeft > 0 && (
                <div className="flex items-center text-brainblitz-primary">
                  <Clock size={18} className="mr-1" />
                  <span className="font-bold">{timeLeft}s</span>
                </div>
              )}
            </div>
            
            <p className="text-lg mb-6">{currentQuestion.question_text}</p>
            
            {/* Options for multiple choice */}
            {currentQuestion.question_type === "multiple_choice" && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`w-full text-left p-4 rounded-lg transition ${
                      hasAnswered 
                        ? selectedAnswer === option.text
                          ? option.text === currentQuestion.correct_answer
                            ? "bg-green-100 border-2 border-green-500"
                            : "bg-red-100 border-2 border-red-500"
                          : option.text === currentQuestion.correct_answer
                            ? "bg-green-50 border border-green-500"
                            : "bg-gray-100 border border-gray-300"
                        : selectedAnswer === option.text
                          ? "bg-brainblitz-primary text-white"
                          : "bg-gray-100 hover:bg-gray-200 border border-gray-300"
                    }`}
                    onClick={() => {
                      if (!hasAnswered && !answerSubmitting) {
                        setSelectedAnswer(option.text);
                      }
                    }}
                    disabled={hasAnswered || answerSubmitting}
                  >
                    <div className="flex items-center">
                      {hasAnswered && option.text === currentQuestion.correct_answer && (
                        <CheckCircle className="text-green-500 mr-2" size={18} />
                      )}
                      <span>{option.text}</span>
                    </div>
                  </button>
                ))}
                
                {selectedAnswer && !hasAnswered && (
                  <Button 
                    onClick={() => submitAnswer(selectedAnswer)}
                    className="w-full mt-4"
                    disabled={answerSubmitting}
                  >
                    {answerSubmitting ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Answer'
                    )}
                  </Button>
                )}
                
                {hasAnswered && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-center">
                      {selectedAnswer === currentQuestion.correct_answer 
                        ? "Your answer is correct! ✓" 
                        : `Your answer is incorrect. The correct answer is: ${currentQuestion.correct_answer}`}
                    </p>
                    <p className="text-center text-sm text-brainblitz-dark-gray mt-2">
                      Waiting for other players to answer...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Player list */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Players</h2>
          <div className="space-y-2">
            {/* Current player (you) */}
            <div className="flex items-center justify-between bg-brainblitz-primary bg-opacity-10 p-3 rounded-lg border border-brainblitz-primary">
              <span className="font-medium">{playerName} (You)</span>
              <span className="bg-brainblitz-primary text-white px-2 py-1 rounded">{playerSession?.score || 0}</span>
            </div>
            
            {/* Other players */}
            {otherPlayers.map(player => (
              <div key={player.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="font-medium">{player.player_name}</span>
                <span className="bg-brainblitz-primary text-white px-2 py-1 rounded">{player.score || 0}</span>
              </div>
            ))}
            
            {otherPlayers.length === 0 && (
              <p className="text-brainblitz-dark-gray text-center py-2">No other players have joined yet</p>
            )}
          </div>
        </div>
        
        {/* Waiting screen */}
        {gameStatus === "waiting" && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Waiting for host to start the game</h2>
            <p className="text-brainblitz-dark-gray mb-6">
              The game will begin automatically when the host starts it.
            </p>
            <Spinner className="mx-auto" />
          </div>
        )}
        
        {/* Game over screen */}
        {gameStatus === "completed" && (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Game Over</h2>
            <p className="mb-4">Thank you for playing!</p>
            
            {playerSession && (
              <div className="mb-6">
                <p className="text-lg font-bold">Your final score: {playerSession.score || 0}</p>
              </div>
            )}
            
            <Button onClick={() => navigate("/join")}>Join Another Game</Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PlayGame;
