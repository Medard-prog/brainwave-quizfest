import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Question, GameSession, Quiz, PlayerSession } from "@/lib/types";
import { Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, Trophy } from "lucide-react";
import { usePolling } from "@/utils/polling";
=======
import { Question } from "@/lib/types";
import { Clock, ChevronRight, CheckCircle, Trophy, Users } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
>>>>>>> 6f412d25b434e68cb69d391f0bb006a21a26cb78

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

<<<<<<< HEAD
  // Function to fetch game session data
  const fetchGameData = async () => {
=======
  const fetchGameData = async () => {
>>>>>>> 6f412d25b434e68cb69d391f0bb006a21a26cb78
    if (!sessionId || !user) return;
    
<<<<<<< HEAD
    try {
      console.log("Polling: Fetching game session data for host...");
      
      // Try RPC function first to avoid RLS issues
=======
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .select(`
          *,
          quiz:quizzes(*)
        `)
        .eq('id', sessionId)
        .single();
      
      if (sessionError) throw sessionError;
      if (!sessionData) throw new Error("Game session not found");
      
      setGameSession(sessionData);
      setQuiz(sessionData.quiz);
      setCurrentQuestionIndex(sessionData.current_question_index || 0);
      
>>>>>>> 6f412d25b434e68cb69d391f0bb006a21a26cb78
      try {
<<<<<<< HEAD
        const { data: sessionData, error: rpcError } = await supabase
          .rpc('get_game_session_details', { session_id: sessionId });
          
        if (!rpcError && sessionData && sessionData.length > 0) {
          console.log("Polling: Game session updated via RPC:", sessionData[0]);
          
          // Update current question index if it changed
          if (gameSession && gameSession.current_question_index !== sessionData[0].current_question_index) {
            console.log(`Polling: Question index changed from ${gameSession.current_question_index} to ${sessionData[0].current_question_index}`);
            setCurrentQuestionIndex(sessionData[0].current_question_index || 0);
          }
          
          setGameSession(sessionData[0] as GameSession);
          
          // Fetch quiz if we don't have it
          if (!quiz && sessionData[0].quiz_id) {
            fetchQuizData(sessionData[0].quiz_id);
          }
          
          return;
        }
      } catch (e) {
        console.error("Polling: RPC fetch failed:", e);
      }
      
      // Fallback to direct query with join
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
      
      // Update current question index if it changed
      if (gameSession && gameSession.current_question_index !== sessionData.current_question_index) {
        console.log(`Polling: Question index changed from ${gameSession.current_question_index} to ${sessionData.current_question_index}`);
        setCurrentQuestionIndex(sessionData.current_question_index || 0);
=======
        const { data: questionsData, error: functionError } = await supabase
          .rpc('get_quiz_questions', { quiz_id: sessionData.quiz.id });
          
        if (!functionError && questionsData) {
          console.log("Questions fetched via RPC:", questionsData);
          setQuestions(questionsData);
        } else {
          throw functionError;
        }
      } catch (functionError) {
        console.error("Error using get_quiz_questions RPC:", functionError);
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', sessionData.quiz.id)
          .order('order_num', { ascending: true });
        
        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);
>>>>>>> 6f412d25b434e68cb69d391f0bb006a21a26cb78
      }
<<<<<<< HEAD
      
      setGameSession(sessionData as GameSession);
      setQuiz(sessionData.quiz as Quiz);
      
      // Check if game has ended
      if (sessionData.status === 'completed' && !gameEnded) {
        setGameEnded(true);
      }
    } catch (error) {
      console.error("Polling: Error in fetchGameData:", error);
    }
  };
  
  // Function to fetch quiz data if needed
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
      
      // Also fetch questions for this quiz
      fetchQuestions(quizId);
    } catch (error) {
      console.error("Polling: Error in fetchQuizData:", error);
    }
  };
  
  // Function to fetch questions
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
=======
      
      fetchPlayers();
    } catch (error) {
      console.error("Error fetching game data:", error);
      toast.error("Failed to load game data");
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId || !user) return;
    
    fetchGameData();
    
    const pollInterval = setInterval(fetchGameData, 1000);
    
    return () => clearInterval(pollInterval);
  }, [sessionId, user, navigate]);
>>>>>>> 6f412d25b434e68cb69d391f0bb006a21a26cb78

  // Function to fetch players
  const fetchPlayers = async () => {
    if (!sessionId) return;
    
    try {
<<<<<<< HEAD
      console.log("Polling: Fetching players for game session:", sessionId);
      
      // Try RPC function first
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
      
      // Fallback to direct query
      const { data: playersData, error: playersError } = await supabase
=======
      try {
        const { data: playersData, error: rpcError } = await supabase
          .rpc('get_player_sessions_for_game', { p_game_session_id: sessionId });
          
        if (!rpcError && playersData) {
          console.log("Players fetched via RPC:", playersData);
          setPlayers(playersData);
          return;
        }
      } catch (rpcError) {
        console.error("RPC error fetching players:", rpcError);
      }
      
      const { data, error } = await supabase
>>>>>>> 6f412d25b434e68cb69d391f0bb006a21a26cb78
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
  
  // Set up polling for real-time updates
  const { isPolling, error: pollingError } = usePolling(async () => {
    await fetchGameData();
    await fetchPlayers();
  }, 1000);
  
  // Log polling errors
  useEffect(() => {
    if (pollingError) {
      console.error("Polling error:", pollingError);
    }
  }, [pollingError]);

  // Initial data loading
  useEffect(() => {
    if (!sessionId || !user) return;
    
    const initializePresentation = async () => {
      try {
        setIsLoading(true);
        
        // Initial data loading is handled by the polling hook
        // Just wait for the first poll to complete
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

  const startQuestion = async () => {
    if (!questions[currentQuestionIndex]) {
      console.error("No question found at index:", currentQuestionIndex);
      toast.error("No question found to display");
      return;
    }
    
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
        .update({ 
          status: 'active',
          current_question_index: currentQuestionIndex,
          started_at: gameSession.started_at || new Date().toISOString()
        })
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
          status: 'completed',
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
        <Spinner size="lg" />
      </div>
    );
  }

  if (!gameSession || !quiz) {
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

  if (questions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-xl font-bold mb-4">No questions found</h1>
          <p className="mb-6">This quiz doesn't have any questions. Please add questions before hosting a game.</p>
          <Button asChild className="mr-2">
            <a href={`/edit-quiz/${quiz.id}`}>Add Questions</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion && questions.length > 0) {
    console.error("Current question is undefined but questions exist", { currentQuestionIndex, questionsLength: questions.length });
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-xl font-bold mb-4">Question Error</h1>
          <p className="mb-6">Unable to load the current question. Please try refreshing.</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-brainblitz-primary/5 to-brainblitz-accent/5">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          {quiz.game_pin && (
            <div className="ml-4 bg-brainblitz-primary/10 px-3 py-1 rounded text-sm font-medium">
              PIN: {quiz.game_pin}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-brainblitz-dark-gray">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <Button variant="destructive" size="sm" onClick={endGame}>
            End Game
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className="absolute top-4 right-4 z-10 bg-white rounded-full px-3 py-1 shadow-md flex items-center">
          <Users size={16} className="mr-2 text-brainblitz-primary" />
          <span className="font-medium">{players.length}</span>
        </div>
        
        {gameEnded ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-brainblitz-primary to-indigo-600 p-8 text-white text-center">
                <Trophy size={64} className="mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                <p className="text-xl opacity-90">Final Scores</p>
              </div>
              
              <div className="p-6">
                {players.length === 0 ? (
                  <p className="text-center text-brainblitz-dark-gray">No players joined this game.</p>
                ) : (
                  <>
                    {players.length > 0 && (
                      <div className="flex flex-col sm:flex-row justify-center items-center gap-8 mb-8">
                        {players.length > 1 && (
                          <div className="order-2 sm:order-1">
                            <div className="flex flex-col items-center">
                              <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <span className="text-2xl font-bold">{players[1]?.player_name?.charAt(0)}</span>
                              </div>
                              <div className="text-lg font-bold">{players[1]?.player_name}</div>
                              <div className="text-3xl font-bold text-brainblitz-dark-gray">{players[1]?.score}</div>
                              <div className="text-md font-semibold bg-gray-300 px-3 py-1 rounded mt-2">2nd</div>
                            </div>
                          </div>
                        )}
                        
                        <div className="order-1 sm:order-2">
                          <div className="flex flex-col items-center">
                            <div className="h-28 w-28 bg-brainblitz-primary text-white rounded-full flex items-center justify-center mb-2">
                              <span className="text-3xl font-bold">{players[0]?.player_name?.charAt(0)}</span>
                            </div>
                            <div className="text-xl font-bold">{players[0]?.player_name}</div>
                            <div className="text-4xl font-bold text-brainblitz-primary">{players[0]?.score}</div>
                            <div className="text-md font-semibold bg-brainblitz-primary text-white px-3 py-1 rounded mt-2">1st</div>
                          </div>
                        </div>
                        
                        {players.length > 2 && (
                          <div className="order-3">
                            <div className="flex flex-col items-center">
                              <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <span className="text-2xl font-bold">{players[2]?.player_name?.charAt(0)}</span>
                              </div>
                              <div className="text-lg font-bold">{players[2]?.player_name}</div>
                              <div className="text-3xl font-bold text-brainblitz-dark-gray">{players[2]?.score}</div>
                              <div className="text-md font-semibold bg-brainblitz-accent px-3 py-1 rounded mt-2">3rd</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {players.length > 3 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-bold mb-4">Leaderboard</h3>
                        <div className="max-h-60 overflow-y-auto">
                          {players.slice(3).map((player, index) => (
                            <div key={player.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2">
                              <div className="flex items-center gap-3">
                                <div className="text-brainblitz-dark-gray font-medium">{index + 4}.</div>
                                <div className="font-medium">{player.player_name}</div>
                              </div>
                              <div className="font-bold">{player.score}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex justify-center mt-8">
                  <Button onClick={endGame} size="lg">
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : !showQuestion ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-3xl w-full">
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Players in the game
                  </h3>
                  <span className="text-brainblitz-primary font-bold">{players.length}</span>
                </div>
                
                {players.length === 0 ? (
                  <div className="text-center py-4 text-brainblitz-dark-gray">
                    <p>No players have joined yet</p>
                    <p className="text-sm mt-2">Share the PIN or QR code to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {players.map(player => (
                      <div 
                        key={player.id}
                        className="bg-gray-50 rounded-lg p-3 text-center"
                      >
                        <div className="font-medium truncate">{player.player_name}</div>
                        <div className="text-xs text-brainblitz-dark-gray">Score: {player.score}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  Question {currentQuestionIndex + 1}
                </h2>
                <p className="text-brainblitz-dark-gray mb-8 text-lg">
                  {currentQuestion.points} points
                  {currentQuestion.time_limit ? ` • ${currentQuestion.time_limit} seconds` : ''}
                </p>
                
                <Button 
                  size="lg" 
                  onClick={startQuestion}
                  className="px-8 py-6 text-lg"
                  disabled={players.length === 0}
                >
                  {players.length === 0 ? "Waiting for players to join..." : "Start Question"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-4 sm:p-8">
            <div className="flex justify-between items-center mb-4">
              {timerActive && (
                <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm text-brainblitz-primary font-bold">
                  <Clock className="mr-2" size={20} />
                  {timeLeft}s
                </div>
              )}
              
              {!timerActive && (
                <div></div>
              )}
              
              {showAnswer && (
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
            
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="max-w-4xl w-full">
                <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold mb-4">
                    {currentQuestion.question_text}
                  </h3>
                  
                  {currentQuestion.question_type === 'multiple_choice' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      {currentQuestion.options?.map((option: any, index: number) => (
                        <div 
                          key={option.id || index}
                          className={`p-4 rounded-lg border-2 ${
                            showAnswer 
                              ? option.text === currentQuestion.correct_answer
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 bg-white'
                              : 'border-gray-200 bg-white'
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
                  
                  {(currentQuestion.correct_answer === "True" || currentQuestion.correct_answer === "False") && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div 
                        className={`p-4 rounded-lg border-2 text-center ${
                          showAnswer 
                            ? currentQuestion.correct_answer === "True"
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {showAnswer && currentQuestion.correct_answer === "True" && (
                            <CheckCircle className="text-green-500 mr-2" size={20} />
                          )}
                          <span className="text-lg font-medium">True</span>
                        </div>
                      </div>
                      <div 
                        className={`p-4 rounded-lg border-2 text-center ${
                          showAnswer 
                            ? currentQuestion.correct_answer === "False"
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {showAnswer && currentQuestion.correct_answer === "False" && (
                            <CheckCircle className="text-green-500 mr-2" size={20} />
                          )}
                          <span className="text-lg font-medium">False</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {showAnswer && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h4 className="font-bold text-lg mb-2">Correct Answer:</h4>
                    <p className="text-brainblitz-primary text-lg font-medium">
                      {currentQuestion.correct_answer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GamePresentation;
