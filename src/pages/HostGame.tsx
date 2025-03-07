import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Play, XCircle, QrCode } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Quiz } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";

const HostGame = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    if (!quizId || !user) return;
    
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();
        
        if (quizError) {
          console.error("Error fetching quiz:", quizError);
          toast.error("Failed to load quiz");
          navigate('/my-quizzes');
          return;
        }
        
        if (quizData.creator_id !== user.id) {
          toast.error("You don't have permission to host this quiz");
          navigate('/my-quizzes');
          return;
        }
        
        setQuiz(quizData);
        
        // Generate join URL if game pin exists
        if (quizData.game_pin) {
          // Get the base URL from the current window location
          const baseUrl = window.location.origin;
          setJoinUrl(`${baseUrl}/join/${quizData.game_pin}`);
        }
      } catch (error) {
        console.error("Error in fetchQuiz:", error);
        toast.error("An error occurred while loading quiz data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId, user, navigate]);
  
  const startGame = async () => {
    if (!user || !quiz) return;
    
    try {
      setIsCreatingSession(true);
      console.log("Starting game for quiz:", quiz.id);
      
      // Only generate game pin if it doesn't exist yet
      if (!quiz.game_pin) {
        console.log("Generating game PIN");
        
        // Generate a unique 6-digit PIN
        const generatePin = () => {
          return Math.floor(100000 + Math.random() * 900000).toString();
        };
        
        let pin = generatePin();
        let isUnique = false;
        
        // Check if PIN is unique
        while (!isUnique) {
          const { data, error } = await supabase
            .from('quizzes')
            .select('id')
            .eq('game_pin', pin);
          
          if (error) {
            console.error("Error checking PIN uniqueness:", error);
            throw error;
          }
          
          isUnique = !data || data.length === 0;
          
          if (!isUnique) {
            pin = generatePin();
          }
        }
        
        console.log("Generated unique PIN:", pin);
        
        // Update quiz with the new PIN
        const { error: updateError } = await supabase
          .from('quizzes')
          .update({ game_pin: pin })
          .eq('id', quiz.id);
        
        if (updateError) {
          console.error("Error updating quiz with PIN:", updateError);
          throw updateError;
        }
        
        console.log("Updated quiz with new PIN");
        
        // Update local quiz state and join URL
        const baseUrl = window.location.origin;
        const newJoinUrl = `${baseUrl}/join/${pin}`;
        
        setQuiz({ ...quiz, game_pin: pin });
        setJoinUrl(newJoinUrl);

        // Fetch the updated quiz to ensure we have the latest data
        const { data: updatedQuiz, error: fetchError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quiz.id)
          .single();
          
        if (fetchError) {
          console.error("Error fetching updated quiz:", fetchError);
        } else if (updatedQuiz) {
          console.log("Fetched updated quiz:", updatedQuiz);
          setQuiz(updatedQuiz);
        }
      }
      
      console.log("Checking for existing waiting game sessions");

      let existingSessionId = null;
      
      // Step 1: Try using the RPC function (if deployed)
      try {
        const { data: activeSessions, error: rpcError } = await supabase
          .rpc('get_active_sessions_for_quiz', { p_quiz_id: quiz.id });
          
        if (!rpcError && activeSessions && activeSessions.length > 0) {
          // Use the first active session
          existingSessionId = activeSessions[0].id;
          console.log("Found existing waiting session via RPC:", existingSessionId);
        } else if (rpcError) {
          console.error("RPC error:", rpcError);
        }
      } catch (rpcError) {
        console.error("RPC method not available, trying alternative approach:", rpcError);
      }
      
      // Step 2: Simpler direct query if RPC fails
      if (!existingSessionId) {
        const { data: waitingSessions, error: queryError } = await supabase
          .from('game_sessions')
          .select('id')
          .eq('quiz_id', quiz.id)
          .eq('host_id', user.id)
          .eq('status', 'waiting');
        
        if (queryError) {
          console.error("Error querying sessions:", queryError);
        } else if (waitingSessions && waitingSessions.length > 0) {
          existingSessionId = waitingSessions[0].id;
          console.log("Found existing waiting session via direct query:", existingSessionId);
        }
      }
      
      // If we found an existing session, navigate to it
      if (existingSessionId) {
        navigate(`/present/${existingSessionId}`);
        return;
      }
      
      // No existing session found, create a new one
      console.log("Creating new game session");
      
      // Create session with minimal required data
      const sessionData = {
        quiz_id: quiz.id,
        host_id: user.id,
        status: 'waiting',
        current_question_index: 0
      };
      
      console.log("Creating session with data:", sessionData);
      
      const { data: newSession, error: sessionError } = await supabase
        .from('game_sessions')
        .insert(sessionData)
        .select('id')
        .single();
      
      if (sessionError) {
        console.error("Error creating game session:", sessionError);
        toast.error("Failed to create game session. Try again.");
        return;
      }
      
      // Verify the session was created successfully
      if (!newSession || !newSession.id) {
        console.error("Session creation failed: no ID returned");
        toast.error("Failed to create game session. Try again.");
        return;
      }
      
      console.log("Game session created:", newSession);
      
      // Navigate to the presentation page
      navigate(`/present/${newSession.id}`);
      
    } catch (error) {
      console.error("Error in startGame:", error);
      toast.error("An error occurred while starting the game");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const stopGame = async () => {
    if (!user || !quiz) return;
    
    try {
      setIsLoading(true);
      
      // Remove the game PIN from the quiz
      const { error: updateError } = await supabase
        .from('quizzes')
        .update({ game_pin: null })
        .eq('id', quiz.id);
      
      if (updateError) {
        console.error("Error removing game PIN:", updateError);
        toast.error("Failed to stop the game. Please try again.");
        throw updateError;
      }
      
      // Update local quiz state
      setQuiz({ ...quiz, game_pin: null });
      setJoinUrl('');
      
      toast.success("Game stopped successfully");
    } catch (error) {
      console.error("Error in stopGame:", error);
      toast.error("An error occurred while stopping the game");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
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
            <a href="/my-quizzes">Back to My Quizzes</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Host Game</h1>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">{quiz?.title}</h2>
            <p className="text-brainblitz-dark-gray mb-4">
              {quiz?.description || "No description provided"}
            </p>
            
            {quiz?.game_pin ? (
              <div className="mb-4">
                <p className="text-sm text-brainblitz-dark-gray mb-1">
                  Current Game PIN:
                </p>
                <div className="text-2xl font-bold text-green-500 mb-2">
                  {quiz.game_pin}
                </div>
                <p className="text-sm text-brainblitz-dark-gray mb-4">
                  Share this PIN with your players to join the game.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowQrCode(true)}
                  className="mb-4"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Show QR Code
                </Button>
              </div>
            ) : (
              <p className="text-sm text-brainblitz-dark-gray mb-4">
                No game PIN generated yet. Start the game to generate a PIN.
              </p>
            )}
            
            <div className="flex justify-between">
              {quiz?.game_pin ? (
                <Button 
                  variant="destructive"
                  onClick={stopGame}
                  disabled={isLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Stop Game
                </Button>
              ) : (
                <Button 
                  onClick={startGame}
                  disabled={isLoading || isCreatingSession}
                >
                  {isCreatingSession ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Starting Game...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Game
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={showQrCode} onOpenChange={setShowQrCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code for Game PIN: {quiz?.game_pin}</DialogTitle>
            <DialogDescription>
              Players can scan this QR code to join the game directly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {joinUrl && (
              <>
                <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`} 
                    alt="QR Code to join game"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-center mb-2">or share this link:</p>
                <div className="flex items-center justify-center w-full">
                  <input
                    type="text"
                    value={joinUrl}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md text-sm"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(joinUrl);
                      toast.success("Link copied to clipboard");
                    }}
                    className="rounded-l-none"
                  >
                    Copy
                  </Button>
                </div>
              </>
            )}
          </div>
          <DialogClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default HostGame;
