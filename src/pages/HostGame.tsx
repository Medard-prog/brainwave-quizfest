import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, QrCode, Users, Timer, X } from "lucide-react";
import { Quiz, Question } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const HostGame = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameSession, setGameSession] = useState<any | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!quizId || !user) return;
    
    const fetchQuizAndQuestions = async () => {
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();
        
        if (quizError) throw quizError;
        if (!quizData) throw new Error("Quiz not found");
        
        setQuiz(quizData);
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_num', { ascending: true });
        
        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);
        
        if (!quizData.game_pin) {
          const { data: pinData } = await supabase
            .rpc('generate_unique_game_pin');
          
          if (pinData) {
            const { error: updateError } = await supabase
              .from('quizzes')
              .update({ game_pin: pinData })
              .eq('id', quizId);
            
            if (!updateError) {
              setQuiz({ ...quizData, game_pin: pinData });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        toast.error("Failed to load quiz data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizAndQuestions();
  }, [quizId, user]);

  useEffect(() => {
    if (!quizId || !user) return;
    
    const checkGameSession = async () => {
      try {
        const { data, error } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('status', 'waiting')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setGameSession(data[0]);
          subscribeToPlayers(data[0].id);
        }
      } catch (error) {
        console.error("Error checking game session:", error);
      }
    };
    
    checkGameSession();
  }, [quizId, user]);

  const createGameSession = async () => {
    if (!quizId || !user || !quiz) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('game_sessions')
        .insert({
          quiz_id: quizId,
          host_id: user.id,
          status: 'waiting'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setGameSession(data);
      subscribeToPlayers(data.id);
      toast.success("Game session created successfully");
    } catch (error) {
      console.error("Error creating game session:", error);
      toast.error("Failed to create game session");
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPlayers = (sessionId: string) => {
    const subscription = supabase
      .channel(`player_sessions:${sessionId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'player_sessions',
        filter: `game_session_id=eq.${sessionId}`
      }, (payload) => {
        console.log("Player session change:", payload);
        fetchPlayers(sessionId);
      })
      .subscribe();
    
    fetchPlayers(sessionId);
    
    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const fetchPlayers = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('game_session_id', sessionId);
      
      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  const startGame = async () => {
    if (!gameSession || !quiz) return;
    
    try {
      setIsStarting(true);
      
      const { error } = await supabase
        .from('game_sessions')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', gameSession.id);
      
      if (error) throw error;
      
      navigate(`/present/${gameSession.id}`);
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start the game");
      setIsStarting(false);
    }
  };

  const endGame = async () => {
    if (!gameSession) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('game_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', gameSession.id);
      
      if (error) throw error;
      
      setGameSession(null);
      setPlayers([]);
      toast.success("Game session ended");
    } catch (error) {
      console.error("Error ending game:", error);
      toast.error("Failed to end the game session");
    } finally {
      setIsLoading(false);
    }
  };

  const copyGamePin = () => {
    if (!quiz?.game_pin) return;
    
    navigator.clipboard.writeText(quiz.game_pin);
    setCopied(true);
    toast.success("Game PIN copied to clipboard");
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brainblitz-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
          <p className="mb-6">The quiz you're looking for doesn't exist or you don't have access to it.</p>
          <Button asChild>
            <a href="/dashboard">Back to Dashboard</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{quiz.title}</h1>
            <p className="text-brainblitz-dark-gray">{quiz.description || "No description provided"}</p>
          </div>
          
          {!gameSession ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <h2 className="text-xl font-bold mb-6">Ready to start your quiz?</h2>
              <div className="flex flex-col items-center">
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="text-lg font-bold">Game PIN: {quiz.game_pin || "Not set"}</div>
                    <button 
                      onClick={copyGamePin} 
                      className="text-brainblitz-primary hover:text-brainblitz-primary/80"
                      disabled={!quiz.game_pin}
                    >
                      {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <p className="text-sm text-brainblitz-dark-gray mb-4">
                    Players can join at <span className="font-medium">brainblitz.app/join</span> using this PIN
                  </p>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Button 
                    onClick={createGameSession} 
                    className="w-full sm:w-auto"
                    disabled={questions.length === 0}
                  >
                    Host New Game
                  </Button>
                  {questions.length === 0 && (
                    <p className="text-sm text-rose-500">
                      You need to add questions to this quiz before hosting a game.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Game Lobby</h2>
                    <p className="text-brainblitz-dark-gray">
                      Waiting for players to join...
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="bg-brainblitz-primary/10 text-brainblitz-primary px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                      <span>PIN: {quiz.game_pin}</span>
                      <button 
                        onClick={copyGamePin}
                        className="text-brainblitz-primary hover:text-brainblitz-primary/80"
                      >
                        {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={endGame}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2 text-brainblitz-dark-gray">
                    <Users size={18} />
                    <span>{players.length} Players</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-brainblitz-dark-gray">
                    <Timer size={18} />
                    <span>{questions.length} Questions</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Players</h3>
                  
                  {players.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <p className="text-brainblitz-dark-gray">
                        No players have joined yet. Share the game PIN or QR code to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {players.map((player) => (
                        <div 
                          key={player.id} 
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center"
                        >
                          <Avatar className="h-12 w-12 mx-auto mb-2">
                            <AvatarFallback className="bg-brainblitz-primary text-white">
                              {player.player_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="font-medium truncate">{player.player_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center mt-8">
                  <Button 
                    size="lg" 
                    onClick={startGame} 
                    disabled={players.length === 0 || isStarting}
                    className="w-full sm:w-auto px-8"
                  >
                    {isStarting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                        Starting...
                      </>
                    ) : (
                      "Start Game"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Quiz Questions</h2>
            
            {questions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-brainblitz-dark-gray mb-4">
                  No questions have been added to this quiz yet.
                </p>
                <Button asChild>
                  <a href={`/edit-quiz/${quizId}`}>Add Questions</a>
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-12 text-sm font-medium text-brainblitz-dark-gray">
                    <div className="col-span-1">#</div>
                    <div className="col-span-7">Question</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Points</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {questions.map((question, index) => (
                    <div key={question.id} className="p-4">
                      <div className="grid grid-cols-12 items-center">
                        <div className="col-span-1 font-medium">{index + 1}</div>
                        <div className="col-span-7 truncate">{question.question_text}</div>
                        <div className="col-span-2 capitalize">{question.question_type.replace('_', ' ')}</div>
                        <div className="col-span-2">{question.points}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HostGame;
