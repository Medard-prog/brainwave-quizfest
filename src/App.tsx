
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import MyQuizzesPage from "@/pages/MyQuizzesPage";
import CreateQuiz from "@/pages/CreateQuiz";
import EditQuiz from "@/pages/EditQuiz";
import EditQuestion from "@/pages/EditQuestion";
import HostGame from "@/pages/HostGame";
import GamePresentation from "@/pages/GamePresentation";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SettingsPage from "@/pages/SettingsPage";
import ParticipantsPage from "@/pages/ParticipantsPage";
import Join from "@/pages/Join";
import JoinWithPin from "@/pages/JoinWithPin";
import PlayGame from "@/pages/PlayGame";
import Logout from "@/pages/Logout";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/join" element={<Join />} />
        <Route path="/join/:pin" element={<JoinWithPin />} />
        <Route path="/play/:sessionId" element={<PlayGame />} />
        
        {/* Auth routes wrapped in PublicRoute */}
        <Route 
          path="/login" 
          element={<PublicRoute><Login /></PublicRoute>} 
        />
        <Route 
          path="/register" 
          element={<PublicRoute><Register /></PublicRoute>} 
        />
        <Route 
          path="/forgot-password" 
          element={<PublicRoute><ForgotPassword /></PublicRoute>} 
        />
        <Route 
          path="/reset-password" 
          element={<PublicRoute><ResetPassword /></PublicRoute>} 
        />

        {/* Protected routes wrapped in ProtectedRoute */}
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/my-quizzes" 
          element={<ProtectedRoute><MyQuizzesPage /></ProtectedRoute>} 
        />
        <Route 
          path="/create-quiz" 
          element={<ProtectedRoute><CreateQuiz /></ProtectedRoute>} 
        />
        <Route 
          path="/edit-quiz/:quizId" 
          element={<ProtectedRoute><EditQuiz /></ProtectedRoute>} 
        />
        <Route 
          path="/edit-question" 
          element={<ProtectedRoute><EditQuestion /></ProtectedRoute>} 
        />
        <Route 
          path="/host/:quizId" 
          element={<ProtectedRoute><HostGame /></ProtectedRoute>} 
        />
        <Route 
          path="/present/:sessionId" 
          element={<ProtectedRoute><GamePresentation /></ProtectedRoute>} 
        />
        <Route 
          path="/analytics" 
          element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} 
        />
        <Route 
          path="/settings" 
          element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} 
        />
        <Route 
          path="/participants" 
          element={<ProtectedRoute><ParticipantsPage /></ProtectedRoute>} 
        />
        <Route 
          path="/logout" 
          element={<ProtectedRoute><Logout /></ProtectedRoute>} 
        />

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
