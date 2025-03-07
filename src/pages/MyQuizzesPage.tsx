import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit, Play, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Quiz } from "@/lib/types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

const MyQuizzesPage = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "alphabetical">("newest");
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;
      
      try {
        console.log("Fetching quizzes for user:", user.id);
        setIsLoading(true);
        
        // Get quizzes - we'll do a separate query for questions
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('creator_id', user.id);
        
        if (quizzesError) {
          console.error("Error fetching quizzes:", quizzesError);
          toast.error("Failed to load quizzes");
          throw quizzesError;
        }
        
        console.log("Basic quiz data fetched:", quizzesData);
        
        if (!quizzesData || quizzesData.length === 0) {
          setQuizzes([]);
          return;
        }
        
        // Get all quiz IDs
        const quizIds = quizzesData.map(quiz => quiz.id);
        
        // Get question count for all quizzes in a single query
        const { data: questionsCountData, error: questionsCountError } = await supabase
          .from('questions')
          .select('quiz_id, count')
          .in('quiz_id', quizIds)
          .select('quiz_id', { count: 'exact', groupBy: 'quiz_id' });
        
        if (questionsCountError) {
          console.error("Error fetching question counts:", questionsCountError);
          // We'll continue and just set count to 0
        }
        
        // Prepare a map of quiz_id -> question_count
        let questionCountMap: Record<string, number> = {};
        if (questionsCountData) {
          questionCountMap = questionsCountData.reduce((acc, curr) => {
            acc[curr.quiz_id] = parseInt(curr.count);
            return acc;
          }, {} as Record<string, number>);
        }
        
        // Get game counts with a separate query
        const { data: gameSessionsData, error: gameSessionsError } = await supabase
          .from('game_sessions')
          .select('quiz_id, count')
          .in('quiz_id', quizIds)
          .select('quiz_id', { count: 'exact', groupBy: 'quiz_id' });
        
        // Prepare a map of quiz_id -> game_count
        let gameCountMap: Record<string, number> = {};
        if (gameSessionsData) {
          gameCountMap = gameSessionsData.reduce((acc, curr) => {
            acc[curr.quiz_id] = parseInt(curr.count);
            return acc;
          }, {} as Record<string, number>);
        }
        
        // Now manually fetch all question counts the old way if needed
        if (!questionsCountData) {
          // For each quiz, manually get the question count separately
          for (const quiz of quizzesData) {
            const { count, error } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('quiz_id', quiz.id);
              
            if (!error) {
              questionCountMap[quiz.id] = count || 0;
            }
          }
        }
        
        // Add the counts to quizzes
        const enhancedQuizzes = quizzesData.map(quiz => ({
          ...quiz,
          question_count: questionCountMap[quiz.id] || 0,
          game_count: gameCountMap[quiz.id] || 0
        }));
        
        console.log("Enhanced quizzes:", enhancedQuizzes);
        setQuizzes(enhancedQuizzes);
      } catch (error) {
        console.error("Error in fetchQuizzes:", error);
        toast.error("Failed to load quizzes data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizzes();
  }, [user]);

  // Filter quizzes based on search query
  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort quizzes
  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Delete quiz
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizToDelete.id);
      
      if (error) {
        console.error("Error deleting quiz:", error);
        toast.error("Failed to delete quiz");
        throw error;
      }
      
      // Update state
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizToDelete.id));
      toast.success("Quiz deleted successfully");
    } catch (error) {
      console.error("Error in handleDeleteQuiz:", error);
    } finally {
      setQuizToDelete(null);
      setIsDeleting(false);
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

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Quizzes</h1>
            <p className="text-brainblitz-dark-gray mt-1">
              Manage all your interactive quizzes in one place
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Button asChild className="flex-1 sm:flex-none">
              <Link to="/create-quiz" className="flex items-center gap-2">
                <Plus size={18} />
                <span>Create Quiz</span>
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
            />
          </div>
          
          <div className="min-w-[200px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "alphabetical")}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brainblitz-primary"></div>
          </div>
        ) : sortedQuizzes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-bold mb-2">No quizzes found</h3>
              {searchQuery ? (
                <p className="text-brainblitz-dark-gray mb-6">
                  No quizzes match your search. Try a different query or clear your search.
                </p>
              ) : (
                <p className="text-brainblitz-dark-gray mb-6">
                  You haven't created any quizzes yet. Start by creating your first quiz!
                </p>
              )}
              
              {!searchQuery && (
                <Button asChild>
                  <Link to="/create-quiz" className="flex items-center gap-2">
                    <Plus size={18} />
                    <span>Create First Quiz</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game PIN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Games Hosted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedQuizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{quiz.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{quiz.description || "No description"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {quiz.question_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {quiz.game_pin || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {quiz.game_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-800">
                          <Link to={`/edit-quiz/${quiz.id}`}>
                            <Edit size={16} />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="text-green-600 hover:text-green-800">
                          <Link to={`/host/${quiz.id}`}>
                            <Play size={16} />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-800"
                          onClick={() => setQuizToDelete(quiz)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              Delete Quiz
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{quizToDelete?.title}"? This action cannot be undone
              and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteQuiz();
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default MyQuizzesPage;
