
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Save, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/layouts/DashboardLayout";
import AIQuizAssistant from "@/components/AIQuizAssistant";
import { Question, Quiz } from "@/lib/types";
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

const EditQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState<number>(20);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!quizId || !user) return;
    
    const fetchQuizData = async () => {
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
          toast.error("You don't have permission to edit this quiz");
          navigate('/my-quizzes');
          return;
        }
        
        setQuiz(quizData);
        setTitle(quizData.title);
        setDescription(quizData.description || "");
        setTimeLimit(quizData.time_limit || 20);
        setShuffleQuestions(quizData.shuffle_questions || false);
        setIsPublic(quizData.is_public || false);
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_num', { ascending: true });
        
        if (questionsError) {
          console.error("Error fetching questions:", questionsError);
          toast.error("Failed to load questions");
          return;
        }
        
        setQuestions(questionsData || []);
      } catch (error) {
        console.error("Error in fetchQuizData:", error);
        toast.error("An error occurred while loading quiz data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizData();
  }, [quizId, user, navigate]);

  const handleSaveQuiz = async () => {
    if (!quizId || !user) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('quizzes')
        .update({
          title,
          description,
          time_limit: timeLimit,
          shuffle_questions: shuffleQuestions,
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', quizId);
      
      if (error) {
        console.error("Error updating quiz:", error);
        toast.error("Failed to save quiz");
        return;
      }
      
      toast.success("Quiz saved successfully");
      
      // Update local quiz state
      setQuiz(prev => prev ? { 
        ...prev, 
        title, 
        description, 
        time_limit: timeLimit,
        shuffle_questions: shuffleQuestions,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      } : null);
      
    } catch (error) {
      console.error("Error in handleSaveQuiz:", error);
      toast.error("An error occurred while saving quiz");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!questionToDelete || !quizId) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionToDelete.id);
      
      if (error) {
        console.error("Error deleting question:", error);
        toast.error("Failed to delete question");
        return;
      }
      
      // Update questions list
      setQuestions(questions.filter(q => q.id !== questionToDelete.id));
      
      // Re-order remaining questions
      const updatedQuestions = questions
        .filter(q => q.id !== questionToDelete.id)
        .map((q, index) => ({ ...q, order_num: index + 1 }));
      
      for (const question of updatedQuestions) {
        await supabase
          .from('questions')
          .update({ order_num: question.order_num })
          .eq('id', question.id);
      }
      
      toast.success("Question deleted successfully");
    } catch (error) {
      console.error("Error in handleDeleteQuestion:", error);
      toast.error("An error occurred while deleting question");
    } finally {
      setIsDeleting(false);
      setQuestionToDelete(null);
    }
  };

  const handleGenerateQuestions = (newQuestions: any[]) => {
    console.log("Generated questions:", newQuestions);
    addQuestionsToQuiz(newQuestions);
  };

  const addQuestionsToQuiz = async (questionsToAdd: any[]) => {
    if (!quizId || !user) return;
    
    try {
      setIsSaving(true);
      
      // Get the current highest order_num
      const startOrderNum = questions.length > 0 
        ? Math.max(...questions.map(q => q.order_num || 0)) + 1
        : 1;
      
      // Prepare all questions with order numbers
      const formattedQuestions = questionsToAdd.map((q, index) => ({
        quiz_id: quizId,
        question_text: q.question_text,
        question_type: q.question_type || "multiple_choice",
        options: q.options,
        correct_answer: q.correct_answer,
        points: q.points || 10,
        time_limit: q.time_limit || timeLimit,
        order_num: startOrderNum + index
      }));
      
      const { data, error } = await supabase
        .from('questions')
        .insert(formattedQuestions)
        .select();
      
      if (error) {
        console.error("Error adding questions:", error);
        toast.error("Failed to add questions");
        return;
      }
      
      // Update the questions state
      setQuestions([...questions, ...data]);
      toast.success(`${data.length} questions added successfully`);
      
    } catch (error) {
      console.error("Error in addQuestionsToQuiz:", error);
      toast.error("An error occurred while adding questions");
    } finally {
      setIsSaving(false);
    }
  };

  const createQuestion = () => {
    navigate(`/edit-question?quizId=${quizId}&new=true`);
  };

  const editQuestion = (questionId: string) => {
    navigate(`/edit-question?quizId=${quizId}&questionId=${questionId}`);
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2" 
              onClick={() => navigate('/my-quizzes')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">Edit Quiz</h1>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="title">Quiz Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter quiz title"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter quiz description"
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="timeLimit">Default Time Limit (seconds)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min={5}
                    max={300}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value) || 20)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="shuffle-questions"
                    checked={shuffleQuestions}
                    onCheckedChange={setShuffleQuestions}
                  />
                  <Label htmlFor="shuffle-questions">Shuffle Questions</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is-public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                  <Label htmlFor="is-public">Make Quiz Public</Label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveQuiz}
                  disabled={isSaving || !title.trim()}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold">Questions</h2>
                  <p className="text-brainblitz-dark-gray">
                    {questions.length} {questions.length === 1 ? 'question' : 'questions'} in this quiz
                  </p>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAIAssistant(true)}
                    className="flex-1 sm:flex-none"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Generate with AI</span>
                  </Button>
                  
                  <Button 
                    onClick={createQuestion}
                    className="flex-1 sm:flex-none"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add Question</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {questions.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-brainblitz-dark-gray mb-4">
                  No questions yet. Start by adding your first question.
                </p>
                <div className="flex justify-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAIAssistant(true)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Generate with AI</span>
                  </Button>
                  
                  <Button onClick={createQuestion}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add Question</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-12 text-sm font-medium text-brainblitz-dark-gray">
                    <div className="col-span-1">#</div>
                    <div className="col-span-7">Question</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {questions.map((question, index) => (
                    <div key={question.id} className="p-4">
                      <div className="grid grid-cols-12 items-center">
                        <div className="col-span-1 font-medium">{index + 1}</div>
                        <div className="col-span-7 truncate">{question.question_text}</div>
                        <div className="col-span-2 capitalize">{question.question_type.replace('_', ' ')}</div>
                        <div className="col-span-2 flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => editQuestion(question.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setQuestionToDelete(question)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* AI Quiz Assistant */}
      {showAIAssistant && (
        <AIQuizAssistant
          onGenerateQuestions={handleGenerateQuestions}
          onClose={() => setShowAIAssistant(false)}
        />
      )}
      
      {/* Delete Question Dialog */}
      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteQuestion();
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Question"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default EditQuiz;
