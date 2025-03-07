
import { Route, Routes } from "react-router-dom";
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
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-quizzes" element={<MyQuizzesPage />} />
          <Route path="/create-quiz" element={<CreateQuiz />} />
          <Route path="/edit-quiz/:quizId" element={<EditQuiz />} />
          <Route path="/edit-question" element={<EditQuestion />} />
          <Route path="/host/:quizId" element={<HostGame />} />
          <Route path="/present/:sessionId" element={<GamePresentation />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/participants" element={<ParticipantsPage />} />
          <Route path="/logout" element={<Logout />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
