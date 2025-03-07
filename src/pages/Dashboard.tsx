
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Quiz } from "@/lib/types";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;
      
      try {
        console.log("Fetching quizzes for user:", user.id);
        setIsLoading(true);
        
        // First, fetch the basic quiz data without the nested counts
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });
        
        if (quizzesError) {
          console.error("Error fetching quizzes:", quizzesError);
          toast.error("Failed to load quizzes");
          throw quizzesError;
        }
        
        // For each quiz, get question count separately
        const enhancedQuizzes = await Promise.all(quizzesData.map(async (quiz) => {
          // Get question count
          const { count: questionCount, error: questionError } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quiz.id);
            
          if (questionError) {
            console.error(`Error fetching question count for quiz ${quiz.id}:`, questionError);
          }
          
          return {
            ...quiz,
            question_count: questionCount || 0
          };
        }));
        
        console.log("Quizzes fetched:", enhancedQuizzes);
        setQuizzes(enhancedQuizzes);
      } catch (error) {
        console.error("Error in fetchQuizzes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizzes();
  }, [user]);

  // Filter quizzes based on search query
  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Quizzes</h1>
            <p className="text-brainblitz-dark-gray mt-1">
              Create, manage, and host interactive quizzes
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
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brainblitz-primary"></div>
          </div>
        ) : filteredQuizzes.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div 
                key={quiz.id} 
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold truncate">{quiz.title}</h3>
                    <Button variant="ghost" size="icon" asChild className="text-gray-500 hover:text-brainblitz-primary">
                      <Link to={`/edit-quiz/${quiz.id}`}>
                        <Settings size={18} />
                      </Link>
                    </Button>
                  </div>
                  
                  <p className="text-brainblitz-dark-gray mb-4 line-clamp-2">
                    {quiz.description || "No description provided"}
                  </p>
                  
                  <div className="flex justify-between items-center text-sm text-brainblitz-dark-gray">
                    <span>{quiz.question_count} questions</span>
                    <span>Game PIN: {quiz.game_pin || "Not set"}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 grid grid-cols-2 divide-x divide-gray-200">
                  <Link 
                    to={`/edit-quiz/${quiz.id}`}
                    className="py-3 text-center font-medium text-brainblitz-primary hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </Link>
                  <Link 
                    to={`/host/${quiz.id}`}
                    className="py-3 text-center font-medium text-brainblitz-primary hover:bg-gray-50 transition-colors"
                  >
                    Host Game
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
