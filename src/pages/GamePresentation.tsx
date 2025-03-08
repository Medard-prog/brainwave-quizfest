import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Question, GameSession, Quiz, PlayerSession } from "@/lib/types";
import { Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, Trophy, Settings } from "lucide-react";
import { usePolling } from "@/utils/polling";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

  const fetchGameData = async () => {
    if (!sessionId || !user) return;
    
    try {
      console.log("Polling: Fetching game session data for host...");
      
      try {
        const { data: sessionData, error: rpcError } = await supabase
          .rpc('get_game_session_details', { session_id: sessionId });
          
        if (!rpcError && sessionData && sessionData.length > 0) {
          console.log("Polling: Game session updated via RPC:", sessionData[0]);
          
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
        return;
      }
      
      console.log("Polling: Questions updated, count:", questionsData?.length);
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

  const startQuestion = async () => {
    if (!questions[currentQuestionIndex]) return;
    
    setShowQuestion(true);
    setShowAnswer(false);
    
    const question = questions[currentQuestionIndex];
    if (question.time_limit) {
      setTimeLeft(question.time_limit);
      setTimerActive(true);
    }
    
    try {
      await supabase
        .from('game_sessions')
        .update({ current_question_index: currentQuestionIndex })
        .eq('id', sessionId);
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
      const { error } = await supabase
        .from('game_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      toast.success("Game ended successfully");
      navigate('/dashboard');
    } catch (error) {
      console.error("Error ending game:", error);
      toast.error("Failed to end the game");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brainblitz-primary"></div>
      </div>
    );
  }

  if (!gameSession || !quiz || questions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Game not found</h1>
          <p className="mb-6">The game you're looking for doesn't exist or has ended.</p>
          <Button asChild>
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

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
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-brainblitz-primary h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">
              {quiz?.title || "Game"}
            </h1>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-4">PIN: <span className="font-bold text-brainblitz-primary">{quiz?.game_pin}</span></span>
            <span className="text-sm font-medium mr-4">Players: <span className="font-bold">{players.length}</span></span>
            {!gameStarted ? (
              <Button 
                onClick={startQuestion}
                disabled={questions.length === 0 || isStarting}
              >
                {isStarting ? (
                  <span>Starting...</span>
                ) : (
                  <span>Start Game</span>
                )}
              </Button>
            ) : gameEnded ? (
              <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={endGame}
                disabled={isEnding}
              >
                {isEnding ? "Ending..." : "End Game"}
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brainblitz-primary"></div>
          </div>
        ) : !gameStarted ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Settings Panel */}
            {renderSettings()}
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Players</h2>
              {players.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {players.map((player) => (
                    <li key={player.id} className="py-3 flex justify-between items-center">
                      <span className="font-medium">{player.player_name}</span>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">Score: {player.score || 0}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 py-8">No players have joined yet</p>
              )}
            </div>
          </div>
        ) : gameEnded ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold mb-6">Game Results</h2>
            
            {players.length > 0 ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">Final Scores</h3>
                <div className="max-w-md mx-auto">
                  <div className="space-y-4">
                    {players
                      .sort((a, b) => (b.score || 0) - (a.score || 0))
                      .map((player, index) => (
                        <div 
                          key={player.id} 
                          className={`flex justify-between items-center p-3 rounded-lg ${
                            index === 0 ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="font-bold w-8">{index + 1}.</span>
                            <span className="font-medium">{player.player_name}</span>
                          </div>
                          <span className="font-bold">{player.score || 0} pts</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No players joined this game</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Players</h2>
                
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
                        <span className="font-medium">{player.player_name}</span>
                        <span className="bg-brainblitz-primary text-white px-2 py-1 rounded-md">
                          {player.score || 0}
                        </span>
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
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <span className="text-sm font-medium text-brainblitz-dark-gray">Question {currentQuestionIndex + 1} of {questions.length}</span>
                        <h3 className="text-xl font-bold mt-1">
                          {showQuestion ? currentQuestion.question_text : "Ready to reveal question?"}
                        </h3>
                      </div>
                      
                      {showQuestion && !showAnswer && (
                        <Button 
                          onClick={() => setShowAnswer(true)}
                          variant="outline"
                        >
                          Show Answer
                        </Button>
                      )}
                      
                      {!showQuestion ? (
                        <Button onClick={() => setShowQuestion(true)}>
                          Show Question
                        </Button>
                      ) : showAnswer && (
                        <Button
                          onClick={nextQuestion}
                          className="ml-auto"
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
                          <div className="bg-white rounded-xl shadow-md p-6 mt-4">
                            <h4 className="font-bold text-lg mb-2">Correct Answer:</h4>
                            <p className="text-brainblitz-primary text-lg font-medium">
                              {currentQuestion.correct_answer}
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
    </div>
  );
};

export default GamePresentation;
