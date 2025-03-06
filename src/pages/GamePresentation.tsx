import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Question } from "@/lib/types";
import { Clock, ChevronLeft, ChevronRight, CheckCircle, XCircle, Trophy } from "lucide-react";

const GamePresentation = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gameSession, setGameSession] = useState<any | null>(null);
  const [quiz, setQuiz] = useState<any | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    if (!sessionId || !user) return;
    
    const fetchGameData = async () => {
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
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', sessionData.quiz.id)
          .order('order_num', { ascending: true });
        
        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);
        
        fetchPlayers();
      } catch (error) {
        console.error("Error fetching game data:", error);
        toast.error("Failed to load game data");
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGameData();
    
    const subscription = supabase
      .channel(`game_session:${sessionId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`
      }, (payload) => {
        console.log("Game session updated:", payload);
        fetchGameData();
      })
      .subscribe();
    
    const playerSubscription = supabase
      .channel(`player_sessions:${sessionId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'player_sessions',
        filter: `game_session_id=eq.${sessionId}`
      }, (payload) => {
        console.log("Player update:", payload);
        fetchPlayers();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(playerSubscription);
    };
  }, [sessionId, user, navigate]);

  const fetchPlayers = async () => {
    if (!sessionId) return;
    
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('game_session_id', sessionId)
        .order('score', { ascending: false });
      
      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-brainblitz-primary/5 to-brainblitz-accent/5">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{quiz.title}</h1>
        <div className="flex items-center gap-4">
          <div className="text-brainblitz-dark-gray">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <Button variant="destructive" size="sm" onClick={endGame}>
            End Game
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden flex flex-col">
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
                    <div className="space-y-4 mb-8">
                      {players.length > 1 && (
                        <div className="flex justify-center items-end h-48 gap-4 mb-8">
                          <div className="flex flex-col items-center">
                            <div className="text-lg font-bold mb-2">{players[1]?.player_name}</div>
                            <div className="bg-gray-300 w-24 h-28 flex items-center justify-center rounded-t-lg">
                              <div className="text-2xl font-bold">{players[1]?.score}</div>
                            </div>
                            <div className="text-xl font-bold">2nd</div>
                          </div>
                        </div>
                      )}
                      
                      {players.length > 0 && (
                        <div className="flex flex-col items-center">
                          <div className="text-lg font-bold mb-2">{players[0]?.player_name}</div>
                          <div className="bg-brainblitz-primary w-24 h-36 flex items-center justify-center rounded-t-lg text-white">
                            <div className="text-2xl font-bold">{players[0]?.score}</div>
                          </div>
                          <div className="text-xl font-bold">1st</div>
                        </div>
                      )}
                      
                      {players.length > 2 && (
                        <div className="flex flex-col items-center">
                          <div className="text-lg font-bold mb-2">{players[2]?.player_name}</div>
                          <div className="bg-brainblitz-accent w-24 h-24 flex items-center justify-center rounded-t-lg">
                            <div className="text-2xl font-bold">{players[2]?.score}</div>
                          </div>
                          <div className="text-xl font-bold">3rd</div>
                        </div>
                      )}
                    </div>
                    
                    {players.length > 3 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-bold mb-4">Leaderboard</h3>
                        <div className="space-y-2">
                          {players.slice(3).map((player, index) => (
                            <div key={player.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
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
            <div className="max-w-3xl w-full text-center">
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
              >
                Start Question
              </Button>
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
                  
                  {currentQuestion.correct_answer === 'True' || currentQuestion.correct_answer === 'False' && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div 
                        className={`p-4 rounded-lg border-2 text-center ${
                          showAnswer 
                            ? currentQuestion.correct_answer === 'True'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {showAnswer && currentQuestion.correct_answer === 'True' && (
                            <CheckCircle className="text-green-500 mr-2" size={20} />
                          )}
                          <span className="text-lg font-medium">True</span>
                        </div>
                      </div>
                      <div 
                        className={`p-4 rounded-lg border-2 text-center ${
                          showAnswer 
                            ? currentQuestion.correct_answer === 'False'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {showAnswer && currentQuestion.correct_answer === 'False' && (
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

