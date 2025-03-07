
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Question, Quiz } from "@/lib/types";

interface Option {
  id: string;
  text: string;
}

const EditQuestion = () => {
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get('quizId');
  const questionId = searchParams.get('questionId');
  const isNew = searchParams.get('new') === 'true';
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<string>("multiple_choice");
  const [options, setOptions] = useState<Option[]>([
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" }
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("");
  const [points, setPoints] = useState<number>(10);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!quizId || !user) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        console.log("Fetching quiz data for ID:", quizId);
        
        // Fetch quiz data
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
        
        // If editing an existing question, fetch it
        if (questionId && !isNew) {
          console.log("Fetching question data for ID:", questionId);
          
          const { data: questionData, error: questionError } = await supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .eq('quiz_id', quizId)
            .single();
          
          if (questionError) {
            console.error("Error fetching question:", questionError);
            toast.error("Failed to load question");
            navigate(`/edit-quiz/${quizId}`);
            return;
          }
          
          console.log("Question data fetched:", questionData);
          
          setQuestionText(questionData.question_text);
          setQuestionType(questionData.question_type);
          setOptions(questionData.options || []);
          setCorrectAnswer(questionData.correct_answer);
          setPoints(questionData.points || 10);
          setTimeLimit(questionData.time_limit);
        } else {
          // For new questions, set default time limit from quiz
          setTimeLimit(quizData.time_limit || 20);
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        toast.error("An error occurred while loading data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [quizId, questionId, isNew, user, navigate]);

  const addOption = () => {
    setOptions([...options, { id: crypto.randomUUID(), text: "" }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      toast.error("Questions must have at least 2 options");
      return;
    }
    
    const newOptions = options.filter(option => option.id !== id);
    setOptions(newOptions);
    
    // If removed option was the correct answer, reset correctAnswer
    if (options.find(o => o.id === id)?.text === correctAnswer) {
      setCorrectAnswer("");
    }
  };

  const updateOption = (id: string, text: string) => {
    const newOptions = options.map(option => 
      option.id === id ? { ...option, text } : option
    );
    setOptions(newOptions);
    
    // If updating the correct answer option, update correctAnswer too
    if (correctAnswer && options.find(o => o.id === id)?.text === correctAnswer) {
      setCorrectAnswer(text);
    }
  };

  const setCorrectOption = (id: string) => {
    const option = options.find(o => o.id === id);
    if (option) {
      setCorrectAnswer(option.text);
    }
  };

  const handleSave = async () => {
    if (!quizId || !user || !quiz) return;
    
    // Validate form
    if (!questionText.trim()) {
      toast.error("Question text is required");
      return;
    }
    
    if (options.some(o => !o.text.trim())) {
      toast.error("All options must have text");
      return;
    }
    
    if (!correctAnswer) {
      toast.error("Please select a correct answer");
      return;
    }
    
    try {
      setIsSaving(true);
      
      console.log("Saving question for quiz:", quizId);
      
      // Get the current order number if creating a new question
      let orderNum = 1;
      if (isNew) {
        const { count, error } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', quizId);
        
        if (!error) {
          orderNum = (count || 0) + 1;
        }
      }
      
      const questionData = {
        quiz_id: quizId,
        question_text: questionText,
        question_type: questionType,
        options: options,
        correct_answer: correctAnswer,
        points: points,
        time_limit: timeLimit,
        ...(isNew && { order_num: orderNum })
      };
      
      console.log("Saving question with data:", questionData);
      
      let result;
      
      if (isNew) {
        // Create new question
        result = await supabase
          .from('questions')
          .insert(questionData)
          .select()
          .single();
      } else {
        // Update existing question
        result = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', questionId)
          .select()
          .single();
      }
      
      if (result.error) {
        console.error("Error saving question:", result.error);
        toast.error("Failed to save question");
        return;
      }
      
      console.log("Question saved successfully:", result.data);
      
      toast.success(`Question ${isNew ? 'created' : 'updated'} successfully`);
      navigate(`/edit-quiz/${quizId}`);
      
    } catch (error) {
      console.error("Error in handleSave:", error);
      toast.error("An error occurred while saving question");
    } finally {
      setIsSaving(false);
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
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2" 
              onClick={() => navigate(`/edit-quiz/${quizId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quiz
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {isNew ? "Create Question" : "Edit Question"}
            </h1>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="question-text">Question</Label>
                <Input
                  id="question-text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter your question here"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="question-type">Question Type</Label>
                <Select
                  value={questionType}
                  onValueChange={setQuestionType}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    {/* Add more question types later */}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Answer Options</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addOption}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant={correctAnswer === option.text ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setCorrectOption(option.id)}
                      >
                        {correctAnswer === option.text ? (
                          <Check className="h-4 w-4" />
                        ) : null}
                      </Button>
                      
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(option.id, e.target.value)}
                        placeholder="Enter an answer option"
                        className="flex-1"
                      />
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                        onClick={() => removeOption(option.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <p className="text-sm text-brainblitz-dark-gray mt-2">
                  Select the correct answer by clicking the circle button.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min={1}
                    max={100}
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 10)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="time-limit">
                    Time Limit (seconds)
                    <span className="text-xs text-brainblitz-dark-gray ml-2">
                      Optional, uses quiz default if empty
                    </span>
                  </Label>
                  <Input
                    id="time-limit"
                    type="number"
                    min={5}
                    max={300}
                    value={timeLimit || ""}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder={`Quiz default: ${quiz.time_limit || 20}s`}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !questionText.trim() || !correctAnswer || options.some(o => !o.text.trim())}
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
                      {isNew ? "Create Question" : "Save Changes"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditQuestion;
