
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  BookOpenCheck,
  Brain,
  Clock,
  PlusCircle,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  // Mock data for recent quizzes
  const recentQuizzes = [
    { id: 1, title: "World Geography 101", plays: 45, questions: 10, date: "2023-05-12" },
    { id: 2, title: "Basic Mathematics", plays: 32, questions: 15, date: "2023-05-10" },
    { id: 3, title: "English Grammar", plays: 28, questions: 12, date: "2023-05-08" },
  ];

  // Stats data
  const stats = [
    { label: "Total Quizzes", value: 24, icon: BookOpenCheck, color: "text-blue-600" },
    { label: "Total Players", value: 362, icon: Users, color: "text-green-600" },
    { label: "Questions Created", value: 487, icon: Brain, color: "text-purple-600" },
    { label: "Play Time", value: "28h", icon: Clock, color: "text-amber-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your quizzes.
            </p>
          </div>
          <Button
            asChild
            className="bg-brainblitz-primary hover:bg-brainblitz-primary/90 rounded-xl text-white self-start"
          >
            <Link to="/create-quiz" className="inline-flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Quiz
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-full p-2 bg-opacity-10 ${stat.color.replace('text-', 'bg-')} bg-opacity-20`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <h2 className="text-3xl font-bold">{stat.value}</h2>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Recent Quizzes */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Quizzes</CardTitle>
              <CardDescription>
                Your most recently created quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full p-2 bg-brainblitz-primary/10">
                        <Brain className="h-5 w-5 text-brainblitz-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{quiz.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {quiz.questions} questions · Created on {new Date(quiz.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold">{quiz.plays}</p>
                        <p className="text-xs text-muted-foreground">Plays</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-lg" asChild>
                        <Link to={`/quizzes/${quiz.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link to="/my-quizzes">View All Quizzes</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>Recent activity on your quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full p-1 bg-green-100">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      5 new students played "World Geography 101"
                    </p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full p-1 bg-blue-100">
                    <Trophy className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      "English Grammar" reached 25 players
                    </p>
                    <p className="text-xs text-muted-foreground">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full p-1 bg-purple-100">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      New analytics available for "Basic Mathematics"
                    </p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                <div className="pt-4 text-center">
                  <Button variant="outline" asChild>
                    <Link to="/analytics">View Analytics</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
