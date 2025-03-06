import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Save, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/layouts/DashboardLayout";
import AIQuizAssistant from "@/components/AIQuizAssistant";

// Define question type options
const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "fill_blank", label: "Fill in the Blank" },
  { value: "matching", label: "Matching" },
  { value: "drag_drop", label: "Drag & Drop" },
];

interface Option {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: Option[];
  correct_answer: string;
  points: number;
  time_limit?: number;
}

const CreateQuiz = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number | undefined>();
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUsingAI, setIsUsingAI] = useState(false);

  // Active question or a new empty question if none is selected
  const activeQuestion = activeQuestionIndex !== null 
    ? questions[activeQuestionIndex] 
    : {
        id: crypto.randomUUID(),
        question_text: "",
        question_type: "multiple_choice",
        options: [
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" },
          { id: crypto.randomUUID(), text: "" }
        ],
        correct_answer: "",
        points: 10,
        time_limit: 30
      };

  // Add a new empty question
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      question_text: "",
      question_type: "multiple_choice",
      options: [
        { id: crypto.randomUUID(), text: "" },
        { id: crypto.randomUUID(), text: "" },
        { id: crypto.randomUUID(), text: "" },
        { id: crypto.randomUUID(), text: "" }
      ],
      correct_answer: "",
      points: 10,
      time_limit: 30
    };
    
    setQuestions([...questions, newQuestion]);
    setActiveQuestionIndex(questions.length);
  };

  // Update the active question
  const updateActiveQuestion = (
    field: keyof QuizQuestion, 
    value: string | number | Option[]
  ) => {
    if (activeQuestionIndex === null) return;
    
    const updatedQuestions = [...questions];
    
    // Handle special case for question type change
    if (field === 'question_type' && value !== questions[activeQuestionIndex].question_type) {
      // Reset options and correct answer based on the new question type
      const newOptions = value === 'multiple_choice' 
        ? [
            { id: crypto.randomUUID(), text: "" },
            { id: crypto.randomUUID(), text: "" },
            { id: crypto.randomUUID(), text: "" },
            { id: crypto.randomUUID(), text: "" }
          ]
        : [];
        
      updatedQuestions[activeQuestionIndex] = {
        ...updatedQuestions[activeQuestionIndex],
        question_type: value as string,
        options: newOptions,
        correct_answer: ""
      };
    } else {
      // Normal field update
      updatedQuestions[activeQuestionIndex] = {
        ...updatedQuestions[activeQuestionIndex],
        [field]: value
      };
    }
    
    setQuestions(updatedQuestions);
  };

  // Update an option for multiple choice questions
  const updateOption = (optionId: string, text: string) => {
    if (activeQuestionIndex === null) return;
    
    const updatedQuestions = [...questions];
    const updatedOptions = updatedQuestions[activeQuestionIndex].options.map(option => 
      option.id === optionId ? { ...option, text } : option
    );
    
    updatedQuestions[activeQuestionIndex].options = updatedOptions;
    setQuestions(updatedQuestions);
  };

  // Add a new option for multiple choice questions
  const addOption = () => {
    if (activeQuestionIndex === null) return;
    
    const updatedQuestions = [...questions];
    updatedQuestions[activeQuestionIndex].options.push({ 
      id: crypto.randomUUID(), 
      text: "" 
    });
    
    setQuestions(updatedQuestions);
  };

  // Remove an option
  const removeOption = (optionId: string) => {
    if (activeQuestionIndex === null) return;
    
    const updatedQuestions = [...questions];
    
    // Don't allow fewer than 2 options
    if (updatedQuestions[activeQuestionIndex].options.length <= 2) {
      toast({
        title: "Cannot remove option",
        description: "Multiple choice questions must have at least 2 options",
        variant: "destructive",
      });
      return;
    }
    
    updatedQuestions[activeQuestionIndex].options = 
      updatedQuestions[activeQuestionIndex].options.filter(option => option.id !== optionId);
      
    // Reset correct answer if it was the removed option
    if (updatedQuestions[activeQuestionIndex].correct_answer === optionId) {
      updatedQuestions[activeQuestionIndex].correct_answer = "";
    }
    
    setQuestions(updatedQuestions);
  };

  // Remove a question
  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
    
    // Adjust active question index
    if (activeQuestionIndex === index) {
      setActiveQuestionIndex(null);
    } else if (activeQuestionIndex !== null && activeQuestionIndex > index) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }
  };

  // Save the quiz
  const saveQuiz = async () => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create a quiz",
        variant: "destructive",
      });
      return;
    }
    
    if (!title) {
      toast({
        title: "Missing title",
        description: "Please enter a title for your quiz",
        variant: "destructive",
      });
      return;
    }
    
    if (questions.length === 0) {
      toast({
        title: "No questions",
        description: "Your quiz must have at least one question",
        variant: "destructive",
      });
      return;
    }
    
    // Validate all questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.question_text) {
        toast({
          title: "Empty question",
          description: `Question ${i + 1} has no text`,
          variant: "destructive",
        });
        return;
      }
      
      if (q.question_type === "multiple_choice") {
        if (q.options.some(opt => !opt.text)) {
          toast({
            title: "Empty options",
            description: `Question ${i + 1} has empty options`,
            variant: "destructive",
          });
          return;
        }
        
        if (!q.correct_answer) {
          toast({
            title: "No correct answer",
            description: `Question ${i + 1} has no correct answer selected`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    setIsSaving(true);
    
    try {
      // Generate a game pin
      const { data: pinData } = await supabase.rpc('generate_unique_game_pin');
      const gamePin = pinData;
      
      // Create quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title,
          description,
          creator_id: user.id,
          game_pin: gamePin,
          is_public: isPublic,
          time_limit: timeLimit,
          shuffle_questions: shuffleQuestions
        })
        .select()
        .single();
      
      if (quizError) throw quizError;
      
      // Prepare questions data
      const questionsData = questions.map((q, index) => ({
        quiz_id: quizData.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        points: q.points,
        time_limit: q.time_limit,
        order_num: index + 1
      }));
      
      // Insert questions
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsData);
      
      if (questionsError) throw questionsError;
      
      toast({
        title: "Quiz created!",
        description: "Your quiz has been successfully created",
      });
      
      // Navigate to the quiz list
      navigate('/dashboard');
      
    } catch (error: any) {
      toast({
        title: "Error saving quiz",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle AI-generated questions
  const handleAIQuestions = (generatedQuestions: QuizQuestion[]) => {
    setQuestions(generatedQuestions);
    setIsUsingAI(false);
    
    if (generatedQuestions.length > 0) {
      setActiveQuestionIndex(0);
    }
    
    toast({
      title: "Questions generated",
      description: `${generatedQuestions.length} questions have been generated`,
    });
  };

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Create New Quiz</h1>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button
              onClick={saveQuiz}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
              ) : (
                <Save size={18} />
              )}
              Save Quiz
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Quiz list */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 h-fit">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Quiz Questions</h2>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsUsingAI(true)}
                >
                  AI
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={addQuestion}
                  className="flex items-center gap-1 text-brainblitz-primary"
                >
                  <PlusCircle size={16} />
                  Add
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
              {questions.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No questions yet</p>
                  <p className="text-sm mt-1">Click "Add" to create one</p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <div 
                    key={question.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      activeQuestionIndex === index 
                        ? "border-brainblitz-primary bg-brainblitz-primary/5" 
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setActiveQuestionIndex(index)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Q{index + 1}.</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                            {QUESTION_TYPES.find(t => t.value === question.question_type)?.label || "Question"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm line-clamp-2">
                          {question.question_text || "No question text"}
                        </p>
                      </div>
                      
                      <button
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeQuestion(index);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Right side - Quiz editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quiz details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-lg mb-4">Quiz Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Title*
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                    placeholder="Enter quiz title"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary min-h-[100px]"
                    placeholder="Enter quiz description (optional)"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="timeLimit" className="block text-sm font-medium mb-1">
                      Time Limit (seconds per question)
                    </label>
                    <input
                      id="timeLimit"
                      type="number"
                      value={timeLimit || ""}
                      onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                      placeholder="Optional"
                      min="5"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center h-full pt-6">
                      <input
                        id="isPublic"
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="h-4 w-4 text-brainblitz-primary focus:ring-brainblitz-primary border-gray-300 rounded"
                      />
                      <label htmlFor="isPublic" className="ml-2 text-sm">
                        Make quiz public
                      </label>
                    </div>
                    
                    <div className="flex items-center h-full pt-6">
                      <input
                        id="shuffleQuestions"
                        type="checkbox"
                        checked={shuffleQuestions}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                        className="h-4 w-4 text-brainblitz-primary focus:ring-brainblitz-primary border-gray-300 rounded"
                      />
                      <label htmlFor="shuffleQuestions" className="ml-2 text-sm">
                        Shuffle questions
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Question editor */}
            {activeQuestionIndex !== null ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-lg mb-4">Edit Question {activeQuestionIndex + 1}</h2>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="questionText" className="block text-sm font-medium mb-1">
                      Question Text*
                    </label>
                    <textarea
                      id="questionText"
                      value={activeQuestion.question_text}
                      onChange={(e) => updateActiveQuestion('question_text', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary min-h-[80px]"
                      placeholder="Enter your question"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="questionType" className="block text-sm font-medium mb-1">
                      Question Type*
                    </label>
                    <select
                      id="questionType"
                      value={activeQuestion.question_type}
                      onChange={(e) => updateActiveQuestion('question_type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                      required
                    >
                      {QUESTION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Multiple choice options */}
                  {activeQuestion.question_type === "multiple_choice" && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">
                          Answer Options*
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={addOption}
                          className="flex items-center gap-1 text-brainblitz-primary"
                        >
                          <PlusCircle size={16} />
                          Add Option
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {activeQuestion.options.map((option) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <input
                              type="radio"
                              id={`option-${option.id}`}
                              name="correctAnswer"
                              checked={activeQuestion.correct_answer === option.id}
                              onChange={() => updateActiveQuestion('correct_answer', option.id)}
                              className="h-4 w-4 text-brainblitz-primary focus:ring-brainblitz-primary border-gray-300"
                            />
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) => updateOption(option.id, e.target.value)}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                              placeholder="Enter option text"
                              required
                            />
                            <button
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              onClick={() => removeOption(option.id)}
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Fill in the blank answer */}
                  {activeQuestion.question_type === "fill_blank" && (
                    <div>
                      <label htmlFor="fillBlankAnswer" className="block text-sm font-medium mb-1">
                        Correct Answer*
                      </label>
                      <input
                        id="fillBlankAnswer"
                        type="text"
                        value={activeQuestion.correct_answer}
                        onChange={(e) => updateActiveQuestion('correct_answer', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                        placeholder="Enter the correct answer"
                        required
                      />
                    </div>
                  )}
                  
                  {/* Question settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="points" className="block text-sm font-medium mb-1">
                        Points
                      </label>
                      <input
                        id="points"
                        type="number"
                        value={activeQuestion.points}
                        onChange={(e) => updateActiveQuestion('points', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="questionTimeLimit" className="block text-sm font-medium mb-1">
                        Time Limit (seconds)
                      </label>
                      <input
                        id="questionTimeLimit"
                        type="number"
                        value={activeQuestion.time_limit || ""}
                        onChange={(e) => updateActiveQuestion('time_limit', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
                        placeholder="Optional"
                        min="5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : questions.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-brainblitz-dark-gray">
                  Select a question from the list to edit it
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <p className="text-brainblitz-dark-gray">
                  Add a question to start building your quiz
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isUsingAI && (
        <AIQuizAssistant
          onClose={() => setIsUsingAI(false)}
          onGenerateQuestions={handleAIQuestions}
        />
      )}
    </DashboardLayout>
  );
};

export default CreateQuiz;
