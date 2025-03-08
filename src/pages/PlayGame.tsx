import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import MainLayout from "@/layouts/MainLayout";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { GameSession, PlayerSession, Quiz, Question } from "@/lib/types";
import { usePolling } from "@/utils/polling";
import { CheckCircle, Clock, XCircle, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  
  const fetchGameSession = async () => {
    if (!sessionId) return;
    
    try {
      console.log("Polling: Fetching game session data...");
      
      try {
        const { data: sessionData, error: rpcError } = await supabase
          .rpc('get_game_session_details', { session_id: sessionId });
          
        if (!rpcError && sessionData && sessionData.length > 0) {
          console.log("Polling: Game session updated via RPC:", sessionData[0]);
          const newSession = sessionData[0];
          
          if (gameSession && gameSession.status !== newSession.status) {
            console.log(`Polling: Game status changed from ${gameSession.status} to ${newSession.status}`);
            
            if (gameSession.status === 'waiting' && newSession.status === 'active') {
              console.log("Polling: Game just started! Fetching current question...");
              fetchCurrentQuestion(newSession.current_question_index || 0);
              setHasAnswered(false);
              setSelectedAnswer(null);
            }
          }
          
          if (gameSession?.current_question_index !== newSession.current_question_index) {
            console.log(`Polling: Question index changed from ${gameSession?.current_question_index} to ${newSession.current_question_index}`);
            setPreviousQuestionIndex(gameSession?.current_question_index || null);
            fetchCurrentQuestion(newSession.current_question_index || 0);
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
        
        if (gameSession.status === 'waiting' && sessionData.status === 'active') {
          console.log("Polling: Game just started! Fetching current question...");
          fetchCurrentQuestion(sessionData.current_question_index || 0);
          setHasAnswered(false);
          setSelectedAnswer(null);
        }
      }
      
      if (gameSession && gameSession.current_question_index !== sessionData.current_question_index) {
        console.log(`Polling: Question index changed from ${gameSession.current_question_index} to ${sessionData.current_question_index}`);
        setPreviousQuestionIndex(gameSession.current_question_index || null);
        fetchCurrentQuestion(sessionData.current_question_index || 0);
        setHasAnswered(false);
        setSelectedAnswer(null);
      }
      
      setGameSession(sessionData as unknown as GameSession);
      setGameStatus(sessionData.status);
      
      if (!quiz && sessionData.quiz_id) {
        fetchQuizData(sessionData.quiz_id);
      }
    } catch (error) {
      console.error("Polling: Error in fetchGameSession:", error);
    }
  };
  
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
  
  const fetchPlayers = async () => {
    if (!sessionId || !playerSession) return;
    
    try {
      console.log("Polling: Fetching players for session:", sessionId);
      
      try {
        const { data: playersData, error: rpcError } = await supabase
          .rpc('get_player_sessions_for_game', { p_game_session_id: sessionId });
          
        if (!rpcError && playersData) {
          console.log("Polling: Players data fetched via RPC:", playersData.length, "players");
          
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
        
        const mySession = playersData.find(p => p.id === playerSession.id);
        if (mySession) {
          setPlayerSession(mySession);
        }
        
        const others = playersData.filter(player => player.id !== playerSession.id) as PlayerSession[];
        setOtherPlayers(others);
      }
    } catch (error) {
      console.error("Polling: Error in fetchPlayers:", error);
    }
  };
  
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
        
        if (playerSession?.answers) {
          const answers = Array.isArray(playerSession.answers) ? playerSession.answers : [];
          const hasAnsweredThis = answers.some((a: PlayerAnswer) => 
            a.question_id === questionsData[questionIndex].id || 
            a.question_index === questionIndex
          );
          
          setHasAnswered(hasAnsweredThis);
          if (hasAnsweredThis) {
            const answer = answers.find((a: PlayerAnswer) => 
              a.question_id === questionsData[questionIndex].id || 
              a.question_index === questionIndex
            );
            setSelectedAnswer(answer?.answer || null);
          } else {
            setSelectedAnswer(null);
          }
        } else {
          setHasAnswered(false);
          setSelectedAnswer(null);
        }
        
        if (questionsData[questionIndex].time_limit) {
          setTimeLeft(questionsData[questionIndex].time_limit);
        } else {
          setTimeLeft(null);
        }
      } else {
        console.error("Polling: Question index out of range:", questionIndex, "total questions:", questionsData?.length);
      }
    } catch (error) {
      console.error("Polling: Error in fetchCurrentQuestion:", error);
    }
  };
  
  const submitAnswer = async (answerText: string) => {
    if (!playerSession || !currentQuestion || hasAnswered || !gameSession) return;
    
    try {
      setAnswerSubmitting(true);
      
      console.log("Submitting answer:", answerText, "for question:", currentQuestion.id);
      
      let existingAnswers = playerSession.answers || [];
      if (!Array.isArray(existingAnswers)) {
        existingAnswers = [];
      }
      
      const isCorrect = answerIsCorrect(answerText, currentQuestion);
      
      const newAnswer = {
        question_id: currentQuestion.id,
        answer: answerText,
        correct: isCorrect,
        question_index: gameSession.current_question_index,
        timestamp: new Date().toISOString()
      };
      
      const updatedAnswers = [...existingAnswers, newAnswer];
      
      const pointsToAdd = isCorrect ? (currentQuestion.points || 10) : 0;
      const newScore = (playerSession.score || 0) + pointsToAdd;
      
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
      
      checkIfAllPlayersAnswered();
      
    } catch (error) {
      console.error("Error in submitAnswer:", error);
      toast.error("Failed to submit answer");
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const answerIsCorrect = (selectedAnswer: string, question: Question): boolean => {
    const correctAnswer = question.correct_answer;
    
    if (selectedAnswer === correctAnswer) {
      return true;
    }
    
    if (question.options && Array.isArray(question.options)) {
      const selectedOption = question.options.find(opt => opt.id === selectedAnswer);
      if (selectedOption && selectedOption.text === correctAnswer) {
        return true;
      }
      
      const selectedByText = question.options.find(opt => opt.text === selectedAnswer);
      if (selectedByText && selectedByText.id === correctAnswer) {
        return true;
      }
    }
    
    return false;
  };

  const getAnswerText = (answerId: string) => {
    if (!currentQuestion || !currentQuestion.options) return answerId;
    
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(answerId)) {
      const option = currentQuestion.options.find(opt => opt.id === answerId);
      return option ? option.text : answerId;
    }
    
    return answerId;
  };

  const getCorrectAnswerText = (question: Question): string => {
    if (!question || !question.correct_answer) return "";
    
    if (question.options && Array.isArray(question.options)) {
      const correctOption = question.options.find(
        opt => opt.id === question.correct_answer || opt.text === question.correct_answer
      );
      if (correctOption) {
        return correctOption.text;
      }
    }
    
    return question.correct_answer;
  };

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
      }
    } catch (error) {
      console.error("Error in checkIfAllPlayersAnswered:", error);
    }
  };
  
  const { isPolling, error: pollingError } = usePolling(async () => {
    await fetchGameSession();
    await fetchPlayers();
  }, 1000);
  
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
    
    if (timeLeft === 0 && !hasAnswered && selectedAnswer) {
      submitAnswer(selectedAnswer);
    }
    
    return () => clearInterval(timerInterval);
  }, [timeLeft, hasAnswered, gameStatus, selectedAnswer]);
  
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
  
  useEffect(() => {
    if (pollingError) {
      console.error("Polling error:", pollingError);
    }
  }, [pollingError]);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{quiz?.title || "Game"}</h1>
              <p className="text-brainblitz-dark-gray">{quiz?.description || "No description provided"}</p>
            </div>
            <Badge className="mt-2 sm:mt-0 bg-brainblitz-primary hover:bg-brainblitz-primary">
              <Users className="mr-1 h-3.5 w-3.5" />
              {otherPlayers.length + 1} Players
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={gameStatus === "waiting" ? "outline" : 
                           gameStatus === "active" ? "default" : 
                           "secondary"}>
                {gameStatus === "waiting" ? "Waiting" : 
                 gameStatus === "active" ? "Active" : "Completed"}
              </Badge>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium">Your name</span>
              <Badge variant="outline">{playerName}</Badge>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium">Your score</span>
              <Badge className="bg-brainblitz-primary hover:bg-brainblitz-primary">
                {playerSession?.score || 0}
              </Badge>
            </div>
          </div>
        </div>
        
        {gameStatus === "waiting" ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="animate-pulse mb-6">
                <div className="h-16 w-16 mx-auto rounded-full bg-gray-200 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-4">Waiting for host to start the game</h2>
              <p className="text-brainblitz-dark-gray mb-6">
                The game will begin automatically when the host starts it.
              </p>
              <Spinner className="mx-auto" />
            </div>
          </div>
        ) : gameStatus === "active" && currentQuestion ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <Badge className="bg-brainblitz-primary hover:bg-brainblitz-primary">
                Question {(gameSession?.current_question_index || 0) + 1}
              </Badge>
              
              {timeLeft !== null && timeLeft > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {timeLeft}s
                </Badge>
              )}
            </div>
            
            <h2 className="text-xl font-bold mb-6">{currentQuestion.question_text}</h2>
            
            {currentQuestion.question_type === "multiple_choice" && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const optionId = option.id || option.text;
                  const isSelected = selectedAnswer === optionId;
                  const isCorrectOption = option.id === currentQuestion.correct_answer || option.text === currentQuestion.correct_answer;
                  
                  return (
                    <button
                      key={optionId || index}
                      onClick={() => {
                        if (!hasAnswered && !answerSubmitting) {
                          setSelectedAnswer(optionId);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-lg transition ${
                        hasAnswered 
                          ? isSelected
                            ? answerIsCorrect(optionId, currentQuestion)
                              ? "bg-green-100 border-2 border-green-500"
                              : "bg-red-100 border-2 border-red-500"
                            : isCorrectOption
                              ? "bg-green-50 border border-green-500"
                              : "bg-gray-100 border border-gray-300"
                          : isSelected
                            ? "bg-brainblitz-primary text-white"
                            : "bg-gray-100 hover:bg-gray-200 border border-gray-300"
                      }`}
                      disabled={hasAnswered || answerSubmitting}
                    >
                      <div className="flex items-center">
                        {hasAnswered && isCorrectOption && (
                          <CheckCircle className="text-green-500 mr-2" size={18} />
                        )}
                        {hasAnswered && isSelected && !isCorrectOption && (
                          <XCircle className="text-red-500 mr-2" size={18} />
                        )}
                        <span>{option.text}</span>
                      </div>
                    </button>
                  );
                })}
                
                {selectedAnswer && !hasAnswered && (
                  <Button 
                    onClick={() => submitAnswer(selectedAnswer)}
                    className="w-full mt-4 bg-brainblitz-primary hover:bg-brainblitz-primary/90"
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
                  <div className={`mt-6 p-4 rounded-lg ${
                    answerIsCorrect(selectedAnswer!, currentQuestion) ? 
                    "bg-green-50 border border-green-200" : 
                    "bg-red-50 border border-red-200"
                  }`}>
                    <p className="font-medium text-center">
                      {answerIsCorrect(selectedAnswer!, currentQuestion) 
                        ? "Your answer is correct! ✓" 
                        : "Your answer is incorrect."}
                    </p>
                    
                    {!answerIsCorrect(selectedAnswer!, currentQuestion) && (
                      <p className="mt-2 text-center font-medium text-green-700">
                        The correct answer is: {getCorrectAnswerText(currentQuestion)}
                      </p>
                    )}
                    
                    <p className="text-center text-sm text-brainblitz-dark-gray mt-3">
                      Waiting for other players and the next question...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : gameStatus === "completed" ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="max-w-md mx-auto">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Game Over</h2>
              <p className="mb-6">Thank you for playing!</p>
              
              {playerSession && (
                <div className="mb-8">
                  <p className="text-lg">Your final score:</p>
                  <p className="text-3xl font-bold text-brainblitz-primary mt-2">
                    {playerSession.score || 0}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={() => navigate("/join")}
                className="bg-brainblitz-primary hover:bg-brainblitz-primary/90"
                size="lg"
              >
                Join Another Game
              </Button>
            </div>
          </div>
        ) : null}
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-4">Players</h2>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-brainblitz-primary/10 p-3 rounded-lg border border-brainblitz-primary/20">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-brainblitz-primary/20 flex items-center justify-center mr-3">
                  <span className="font-bold text-brainblitz-primary">{playerName.charAt(0).toUpperCase()}</span>
                </div>
                <span className="font-medium">{playerName} <span className="text-brainblitz-primary text-sm">(You)</span></span>
              </div>
              <Badge className="bg-brainblitz-primary hover:bg-brainblitz-primary">
                {playerSession?.score || 0}
              </Badge>
            </div>
            
            {otherPlayers.length > 0 ? (
              otherPlayers.map(player => (
                <div key={player.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <span className="font-medium text-gray-600">{player.player_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-medium">{player.player_name}</span>
                  </div>
                  <Badge variant="outline" className="font-medium">
                    {player.score || 0}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-brainblitz-dark-gray text-center py-4 border border-dashed border-gray-200 rounded-lg">
                No other players have joined yet
              </p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PlayGame;
