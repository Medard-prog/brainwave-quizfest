import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Question, GameSession, Quiz, PlayerSession } from "@/lib/types";
import { 
  Clock, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Users, 
  Settings,
  RefreshCw
} from "lucide-react";
import { usePolling } from "@/utils/polling";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface GameOption {
  id: string;
  text: string;
}

interface PlayerAnswer {
  question_id: string;
  answer: string;
  correct: boolean;
  question_index: number;
  timestamp: string;
}

const GamePresentation = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [players, setPlayers] = useState<PlayerSession[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGameData = async () => {
    if (!sessionId || !user) return;
    
    try {
      console.log("Polling: Fetching game session data for host...");
      
      try {
        const { data: sessionData, error: rpcError } = await supabase
          .rpc('get_game_session_details', { session_id: sessionId });
          
        if (!rpcError && sessionData && sessionData.length > 0) {
          console.log("Polling: Game session updated via RPC:", sessionData[0]);
          
          if (gameSession && gameSession.status !== sessionData[0].status) {
            console.log(`Polling: Game status changed from ${gameSession.status} to ${sessionData[0].status}`);
            
            if (sessionData[0].status === 'active' && !gameStarted) {
              console.log("Polling: Game is now active, updating gameStarted state");
              setGameStarted(true);
            } else if (sessionData[0].status === 'completed' && !gameEnded) {
              console.log("Polling: Game is now completed, updating gameEnded state");
              setGameEnded(true);
            }
          }
          
          if (gameSession && gameSession.current_question_index !== sessionData[0].current_question_index) {
            console.log(`Polling: Question index changed from ${gameSession.current_question_index} to ${sessionData[0].current_question_index}`);
            setCurrentQuestionIndex(sessionData[0].current_question_index || 0);
          }
          
          setGameSession(sessionData[0] as GameSession);
          
          if (!quiz && sessionData[0].quiz_id) {
            fetchQuizData(sessionData[0].quiz_id);
          }
          
          return;
        }
      } catch (e) {
        console.error("Polling: RPC fetch failed:", e);
      }
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select(`
          *,
          quiz:quizzes(*)
        `)
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
      
      if (gameSession && gameSession.current_question_index !== sessionData.current_question_index) {
        console.log(`Polling: Question index changed from ${gameSession.current_question_index} to ${sessionData.current_question_index}`);
        setCurrentQuestionIndex(sessionData.current_question_index || 0);
      }
      
      setGameSession(sessionData as GameSession);
      setQuiz(sessionData.quiz as Quiz);
      
      if (sessionData.status === 'completed' && !gameEnded) {
        setGameEnded(true);
      }
    } catch (error) {
      console.error("Polling: Error in fetchGameData:", error);
    }
  };
  
  const fetchQuizData = async (quizId: string) => {
    try {
      console.log("Polling: Fetching quiz data:", quizId);
      
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();
      
      if (quizError) {
        console.error("Polling: Error fetching quiz:", quizError);
        return;
      }
      
      console.log("Polling: Quiz data updated:", quizData);
      setQuiz(quizData as Quiz);
      
      fetchQuestions(quizId);
    } catch (error) {
      console.error("Polling: Error in fetchQuizData:", error);
    }
  };
  
  const fetchQuestions = async (quizId: string) => {
    try {
      console.log("Polling: Fetching questions for quiz:", quizId);
      
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_num', { ascending: true });
      
      if (questionsError) {
        console.error("Polling: Error fetching questions:", questionsError);
        toast.error("Failed to load questions");
        return;
      }
      
      console.log("Polling: Questions updated, count:", questionsData?.length);
      
      if (!questionsData || questionsData.length === 0) {
        console.warn("No questions found for this quiz");
        toast.warning("This quiz has no questions. Add questions before starting a game.");
      }
      
      setQuestions(questionsData || []);
    } catch (error) {
      console.error("Polling: Error in fetchQuestions:", error);
    }
  };

  const fetchPlayers = async () => {
    if (!sessionId) return;
    
    try {
      console.log("Polling: Fetching players for game session:", sessionId);
      
      try {
        const { data: playersData, error: rpcError } = await supabase
          .rpc('get_player_sessions_for_game', { p_game_session_id: sessionId });
          
        if (!rpcError && playersData) {
          console.log("Polling: Players updated via RPC, count:", playersData.length);
          setPlayers(playersData);
          return;
        }
      } catch (e) {
        console.error("Polling: RPC player fetch failed:", e);
      }
      
      const { data: playersData, error: playersError } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('game_session_id', sessionId)
        .order('score', { ascending: false });
      
      if (playersError) {
        console.error("Polling: Error fetching players:", playersError);
        return;
      }
      
      console.log("Polling: Players updated, count:", playersData?.length);
      setPlayers(playersData || []);
    } catch (error) {
      console.error("Polling: Error in fetchPlayers:", error);
    }
  };
  
  const refreshData = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await fetchGameData();
      await fetchPlayers();
      toast.success("Game data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };
  
  const { isPolling, error: pollingError } = usePolling(async () => {
    await fetchGameData();
    await fetchPlayers();
  }, 1000);
  
  useEffect(() => {
    if (pollingError) {
      console.error("Polling error:", pollingError);
    }
  }, [pollingError]);

  useEffect(() => {
    if (!sessionId || !user) return;
    
    const initializePresentation = async () => {
      try {
        setIsLoading(true);
        
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      } catch (error) {
        console.error("Error initializing presentation:", error);
        toast.error("Failed to load game data");
        navigate('/dashboard');
      }
    };
    
    initializePresentation();
  }, [sessionId, user, navigate]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
      
      if (timeLeft === 1) {
        setTimerActive(false);
        setShowAnswer(true);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (!gameSession || !questions.length || currentQuestionIndex >= questions.length || 
        !players.length || gameSession?.status !== 'active' || !showQuestion || showAnswer || !autoAdvance) {
      return;
    }
    
    const currentQuestionId = questions[currentQuestionIndex].id;
    const allPlayersAnswered = players.every(player => {
      if (!player.answers) return false;
      const answers = Array.isArray(player.answers) ? player.answers : [];
      return answers.some((answer: PlayerAnswer) => 
        answer.question_id === currentQuestionId || 
        answer.question_index === currentQuestionIndex
      );
    });
    
    if (allPlayersAnswered && players.length > 0) {
      console.log("All players have answered! Auto-advancing in", autoAdvanceDelay, "seconds");
      
      setShowAnswer(true);
      
      const timer = setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          nextQuestion();
        } else {
          endGame();
        }
      }, autoAdvanceDelay * 1000);
      
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, currentQuestionIndex, questions, gameSession, showQuestion, showAnswer, autoAdvance, autoAdvanceDelay]);

  const startGame = async () => {
    if (!sessionId || !user || questions.length === 0) {
      console.log("Cannot start game: missing sessionId, user, or questions");
      return;
    }
    
    try {
      console.log("Starting game for session:", sessionId);
      setIsStarting(true);
      
      // Update the game session status to 'active'
      const { error } = await supabase
        .from('game_sessions')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString(),
          current_question_index: 0
        })
        .eq('id', sessionId);
      
      if (error) {
        console.error("Error starting game:", error);
        toast.error("Failed to start game");
        setIsStarting(false);
        return;
      }
      
      // Update local state
      setGameStarted(true);
      setCurrentQuestionIndex(0);
      
      console.log("Game started successfully");
      toast.success("Game started successfully");
      
      // Show the first question
      showFirstQuestion();
    } catch (error) {
      console.error("Error in startGame:", error);
      toast.error("Failed to start game");
    } finally {
      setIsStarting(false);
    }
  };

  const showFirstQuestion = () => {
    if (questions.length === 0) {
      console.error("No questions available");
      return;
    }
    
    console.log("Showing first question");
    // Reset states for new question
    setShowQuestion(false);
    setShowAnswer(false);
    setCurrentQuestionIndex(0);
    
    // Start the question after a short delay
    setTimeout(() => {
      startQuestion();
    }, 1000);
  };

  const startQuestion = async () => {
    console.log("Starting question", currentQuestionIndex);
    if (!questions[currentQuestionIndex]) {
      console.error("Invalid question index:", currentQuestionIndex);
      return;
    }
    
    setShowQuestion(true);
    setShowAnswer(false);
    
    const question = questions[currentQuestionIndex];
    if (question.time_limit) {
      console.log("Setting timer for", question.time_limit, "seconds");
      setTimeLeft(question.time_limit);
      setTimerActive(true);
    }
    
    try {
      console.log("Updating current question index in database to", currentQuestionIndex);
      const { error } = await supabase
        .from('game_sessions')
        .update({ current_question_index: currentQuestionIndex })
        .eq('id', sessionId);
        
      if (error) {
        console.error("Error updating current question:", error);
      } else {
        console.log("Current question index updated successfully");
      }
    } catch (error) {
      console.error("Error updating current question:", error);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowQuestion(false);
      setShowAnswer(false);
      setTimerActive(false);
    } else {
      setGameEnded(true);
    }
  };

  const endGame = async () => {
    try {
      console.log("Ending game for session:", sessionId);
      setIsEnding(true);
      
      const { error } = await supabase
        .from('game_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      if (error) {
        console.error("Error ending game:", error);
        toast.error("Failed to end game");
        setIsEnding(false);
        return;
      }
      
      setGameEnded(true);
      console.log("Game ended successfully");
      toast.success("Game ended successfully");
    } catch (error) {
      console.error("Error in endGame:", error);
      toast.error("Failed to end game");
    } finally {
      setIsEnding(false);
    }
  };

  useEffect(() => {
    console.log("Current game state:", { 
      gameStarted, 
      gameEnded, 
      questionsCount: questions.length,
      playersCount: players.length,
      currentQuestionIndex,
      showQuestion,
      showAnswer
    });
  }, [gameStarted, gameEnded, questions.length, players.length, currentQuestionIndex, showQuestion, showAnswer]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <h2 className="text-2xl font-bold mb-2">Loading Game</h2>
          <p className="text-brainblitz-dark-gray">Preparing your game session...</p>
        </div>
      </div>
    );
  }

  if (!gameSession || !quiz || questions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="bg-white rounded-xl shadow-md p-8">
            <h1 className="text-2xl font-bold mb-4">Game not found</h1>
            <p className="mb-6 text-brainblitz-dark-gray">The game you're looking for doesn't exist or has ended.</p>
            <Button asChild className="w-full">
              <a href="/dashboard">Back to Dashboard</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  const getAnswerTextFromId = (id: string | null) => {
    if (!id || !currentQuestion || !currentQuestion.options) return "";
    
    const option = currentQuestion.options.find(opt => opt.id === id);
    return option ? option.text : id;
  };

  const renderSettings = () => (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Game Settings</h2>
        <Settings size={20} />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-advance" className="font-medium">Auto-advance questions</Label>
            <p className="text-sm text-brainblitz-dark-gray">
              Automatically move to the next question when all players have answered
            </p>
          </div>
          <Switch 
            id="auto-advance" 
            checked={autoAdvance} 
            onCheckedChange={setAutoAdvance} 
          />
        </div>
        
        {autoAdvance && (
          <div className="pt-2">
            <Label htmlFor="delay" className="font-medium">Delay before advancing (seconds)</Label>
            <div className="flex items-center gap-2 mt-1">
              <input 
                id="delay"
                type="range" 
                min="1" 
                max="10" 
                value={autoAdvanceDelay} 
                onChange={(e) => setAutoAdvanceDelay(parseInt(e.target.value))}
                className="flex-1" 
              />
              <span className="font-medium text-brainblitz-primary">{autoAdvanceDelay}s</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const getPlayerProgress = (): { answered: number, total: number } => {
    if (!gameSession || !questions[currentQuestionIndex]) {
      return { answered: 0, total: 0 };
    }
    
    const currentQuestionId = questions[currentQuestionIndex].id;
    const totalPlayers = players.length;
    
    const playersAnswered = players.filter(player => {
      if (!player.answers) return false;
      const answers = Array.isArray(player.answers) ? player.answers : [];
      return answers.some((answer: PlayerAnswer) => 
        answer.question_id === currentQuestionId || 
        answer.question_index === currentQuestionIndex
      );
    }).length;
    
    return {
      answered: playersAnswered,
      total: totalPlayers
    };
  };

  const renderPlayerProgress = () => {
    const { answered, total } = getPlayerProgress();
    
    if (total === 0) return null;
    
    const percentage = Math.round((answered / total) * 100);
    
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-sm">Players answered</span>
          <span className="font-bold text-sm">{answered}/{total}</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
              {quiz?.title || "Game"}
            </h1>
            {quiz?.game_pin && (
              <Badge className="ml-3 bg-brainblitz-primary hover:bg-brainblitz-primary">
                PIN: {quiz.game_pin}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Badge variant="outline" className="hidden sm:flex">
              <Users className="h-3.5 w-3.5 mr-1" />
              <span>{players.length} Players</span>
            </Badge>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={refreshData} 
              disabled={refreshing}
              className="hidden sm:flex"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            {gameEnded ? (
              <Button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            ) : !gameStarted ? (
              <Button 
                onClick={startGame}
                disabled={questions.length === 0 || isStarting}
              >
                {isStarting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Starting...
                  </>
                ) : (
                  <span>Start Game</span>
                )}
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={endGame}
                disabled={isEnding}
              >
                {isEnding ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Ending...
                  </>
                ) : (
                  <span>End Game</span>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : !gameStarted ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Settings Panel */}
            {renderSettings()}
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Players</h2>
                <Badge className="bg-brainblitz-primary hover:bg-brainblitz-primary">
                  {players.length}
                </Badge>
              </div>
              
              {players.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {players.map((player) => (
                    <div key={player.id} className="py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-brainblitz-primary/10 flex items-center justify-center mr-3">
                          <span className="font-medium text-brainblitz-primary">{player.player_name.charAt(0)}</span>
                        </div>
                        <span className="font-medium">{player.player_name}</span>
                      </div>
                      <Badge variant="outline" className="font-semibold">
                        {player.score || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed border-gray-200 rounded-lg">
                  <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-brainblitz-dark-gray">No players have joined yet</p>
                  <p className="text-sm text-gray-400 mt-1">Share the PIN with your players</p>
                </div>
              )}
            </div>
            
            {/* No questions warning */}
            {questions.length === 0 && (
              <div className="md:col-span-2 bg-amber-50 rounded-xl shadow-md p-6 mt-4 border border-amber-200">
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-xl font-bold text-amber-700 mb-2">No Questions Available</h3>
                  <p className="text-amber-700 mb-4">
                    This quiz doesn't have any questions yet. You need to add questions before you can start a game.
                  </p>
                  <Button
                    onClick={() => navigate(`/edit-quiz/${quiz?.id}`)}
                    variant="outline"
                    className="bg-white border-amber-500 hover:bg-amber-100 text-amber-700"
                  >
                    Add Questions to Quiz
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : gameEnded ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-brainblitz-primary to-indigo-600 p-6 sm:p-8 text-white text-center">
              <Trophy className="mx-auto h-16 w-16 mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Game Results</h2>
              <p className="text-white/80">Congratulations to all participants!</p>
            </div>
            
            {players.length > 0 ? (
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-6 text-center">Final Scores</h3>
                
                {/* Podium for top 3 */}
                {players.length >= 2 && (
                  <div className="flex flex-wrap justify-center items-end gap-4 mb-10">
                    {/* 2nd Place */}
                    {players.length > 1 && (
                      <div className="order-1 text-center">
                        <div className="h-16 w-28 bg-gray-200 rounded-t-lg mb-2"></div>
                        <div className="h-14 w-14 bg-gray-100 rounded-full border-4 border-gray-300 flex items-center justify-center mx-auto mb-1">
                          <span className="text-xl font-bold">{players[1]?.player_name?.charAt(0)}</span>
                        </div>
                        <p className="font-bold">{players[1]?.player_name}</p>
                        <p className="text-xl font-bold text-gray-600">{players[1]?.score || 0}</p>
                        <Badge className="mt-1 bg-gray-500 hover:bg-gray-500">2nd Place</Badge>
                      </div>
                    )}
                    
                    {/* 1st Place */}
                    <div className="order-2 text-center scale-110 pb-2">
                      <div className="h-24 w-32 bg-yellow-200 rounded-t-lg mb-2"></div>
                      <div className="h-16 w-16 bg-yellow-100 rounded-full border-4 border-yellow-400 flex items-center justify-center mx-auto mb-1">
                        <span className="text-2xl font-bold">{players[0]?.player_name?.charAt(0)}</span>
                      </div>
                      <p className="font-bold">{players[0]?.player_name}</p>
                      <p className="text-2xl font-bold text-brainblitz-primary">{players[0]?.score || 0}</p>
                      <Badge className="mt-1 bg-yellow-500 hover:bg-yellow-500">1st Place</Badge>
                    </div>
                    
                    {/* 3rd Place */}
                    {players.length > 2 && (
                      <div className="order-3 text-center">
                        <div className="h-12 w-28 bg-amber-100 rounded-t-lg mb-2"></div>
                        <div className="h-14 w-14 bg-amber-50 rounded-full border-4 border-amber-200 flex items-center justify-center mx-auto mb-1">
                          <span className="text-xl font-bold">{players[2]?.player_name?.charAt(0)}</span>
                        </div>
                        <p className="font-bold">{players[2]?.player_name}</p>
                        <p className="text-xl font-bold text-gray-600">{players[2]?.score || 0}</p>
                        <Badge className="mt-1 bg-amber-600 hover:bg-amber-600">3rd Place</Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Other players */}
                {players.length > 3 && (
                  <div className="mt-8 max-w-xl mx-auto">
                    <h4 className="text-lg font-medium mb-3 text-brainblitz-dark-gray">Other Players</h4>
                    <div className="space-y-2">
                      {players.slice(3).map((player, index) => (
                        <div 
                          key={player.id} 
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <span className="w-6 text-brainblitz-dark-gray">{index + 4}.</span>
                            <span className="font-medium">{player.player_name}</span>
                          </div>
                          <Badge variant="outline" className="font-semibold">
                            {player.score || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-10 text-center">
                  <Button onClick={() => navigate('/dashboard')} size="lg">
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">No players joined this game</p>
                <Button onClick={() => navigate('/dashboard')} className="mt-4">
                  Back to Dashboard
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Players</h2>
                  <Badge className="bg-brainblitz-primary hover:bg-brainblitz-primary">
                    {players.length}
                  </Badge>
                </div>
                
                {/* Player Progress */}
                {renderPlayerProgress()}
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {players
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map(player => (
                      <div 
                        key={player.id} 
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-brainblitz-primary/10 flex items-center justify-center mr-2">
                            <span className="font-medium text-brainblitz-primary">{player.player_name.charAt(0)}</span>
                          </div>
                          <span className="font-medium">{player.player_name}</span>
                        </div>
                        <Badge className="bg-brainblitz-primary hover:bg-brainblitz-primary">
                          {player.score || 0}
                        </Badge>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              {currentQuestion ? (
                <div>
                  <div className="bg-white rounded-xl shadow-md p-6 mb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          Question {currentQuestionIndex + 1} of {questions.length}
                        </Badge>
                        <h3 className="text-xl sm:text-2xl font-bold">
                          {showQuestion ? currentQuestion.question_text : "Ready to reveal question?"}
                        </h3>
                      </div>
                      
                      <div className="mt-4 sm:mt-0 flex space-x-3 self-end sm:self-auto">
                        {timerActive && timeLeft > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1 text-base">
                            <Clock size={14} />
                            {timeLeft}s
                          </Badge>
                        )}
                        
                        {showQuestion && !showAnswer && (
                          <Button 
                            onClick={() => setShowAnswer(true)}
                            variant="outline"
                          >
                            Show Answer
                          </Button>
                        )}
                        
                        {!showQuestion ? (
                          <Button onClick={() => startQuestion()}>
                            Show Question
                          </Button>
                        ) : showAnswer && (
                          <Button
                            onClick={nextQuestion}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {currentQuestionIndex < questions.length - 1 ? (
                              <>
                                Next Question
                                <ChevronRight className="ml-1" size={18} />
                              </>
                            ) : (
                              <>
                                View Results
                                <Trophy className="ml-1" size={18} />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {showQuestion && (
                      <div>
                        {currentQuestion.question_type === 'multiple_choice' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            {currentQuestion.options?.map((option: GameOption, index: number) => (
                              <div 
                                key={option.id || index}
                                className={`p-4 rounded-lg border-2 ${
                                  showAnswer && option.text === currentQuestion.correct_answer
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200'
                                }`}
                              >
                                <div className="flex items-center">
                                  {showAnswer && option.text === currentQuestion.correct_answer && (
                                    <CheckCircle className="text-green-500 mr-2" size={20} />
                                  )}
                                  <span>{option.text}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {showAnswer && (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6">
                            <h4 className="font-bold text-lg mb-2 text-green-700">Correct Answer:</h4>
                            <p className="text-green-700 text-lg font-medium">
                              {typeof currentQuestion.correct_answer === 'string' && 
                               currentQuestion.correct_answer.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
                                ? getAnswerTextFromId(currentQuestion.correct_answer)
                                : currentQuestion.correct_answer}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <p className="text-lg font-medium">No questions available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-100 py-4 text-center text-sm text-brainblitz-dark-gray">
        <div className="max-w-7xl mx-auto px-4">
          {gameSession && (
            <p>
              Game ID: {gameSession.id.substring(0, 8)}...
              {gameSession.status === 'active' && ' • '}
              {gameSession.status === 'active' && (
                <span className="text-green-600 font-medium">Live</span>
              )}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default GamePresentation;
