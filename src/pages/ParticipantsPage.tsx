
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Download, Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ParticipantsPage = () => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<any[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchParticipants = async () => {
      try {
        // Fetch all game sessions created by this user
        const { data: sessions, error: sessionsError } = await supabase
          .from('game_sessions')
          .select(`
            id,
            quiz_id,
            quizzes!inner(title),
            created_at,
            started_at,
            ended_at
          `)
          .eq('host_id', user.id);
        
        if (sessionsError) throw sessionsError;
        
        if (sessions && sessions.length > 0) {
          // For each session, get the players
          const allParticipants: any[] = [];
          
          for (const session of sessions) {
            const { data: players, error: playersError } = await supabase
              .from('player_sessions')
              .select(`
                id,
                player_name,
                score,
                created_at,
                player:profiles(username, avatar_url)
              `)
              .eq('game_session_id', session.id);
            
            if (playersError) throw playersError;
            
            if (players) {
              // Add quiz and session info to each player
              const playersWithSessionInfo = players.map(player => ({
                ...player,
                quiz_title: session.quizzes?.title || "Unknown Quiz",
                session_date: new Date(session.created_at).toLocaleDateString(),
                completed: session.ended_at ? true : false
              }));
              
              allParticipants.push(...playersWithSessionInfo);
            }
          }
          
          setParticipants(allParticipants);
          setFilteredParticipants(allParticipants);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
        toast.error("Failed to load participants data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchParticipants();
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = participants.filter(
        p => 
          p.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.quiz_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredParticipants(filtered);
    } else {
      setFilteredParticipants(participants);
    }
  }, [searchQuery, participants]);

  const exportParticipants = () => {
    if (filteredParticipants.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    // Create CSV content
    const headers = ["Name", "Quiz", "Score", "Date", "Completed"];
    const csvRows = [
      headers.join(","),
      ...filteredParticipants.map(p => 
        [
          `"${p.player_name}"`,
          `"${p.quiz_title}"`,
          p.score,
          p.session_date,
          p.completed ? "Yes" : "No"
        ].join(",")
      )
    ];
    
    const csvContent = csvRows.join("\n");
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "participants.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Participants data exported successfully");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brainblitz-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Participants</h1>
            <p className="text-brainblitz-dark-gray mt-1">
              View and manage all participants who have joined your quizzes
            </p>
          </div>
          
          <Button
            onClick={exportParticipants}
            disabled={filteredParticipants.length === 0}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </Button>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search participants or quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brainblitz-primary"
            />
          </div>
        </div>
        
        {participants.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <div className="max-w-md mx-auto">
              <Users className="h-12 w-12 mx-auto text-brainblitz-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">No participants yet</h3>
              <p className="text-brainblitz-dark-gray mb-6">
                You haven't hosted any quizzes yet or no one has joined your quiz sessions.
              </p>
              
              <Button asChild className="flex items-center gap-2 mx-auto">
                <a href="/create-quiz">
                  <UserPlus size={16} />
                  <span>Create Quiz</span>
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quiz
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParticipants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {participant.player?.avatar_url ? (
                              <img className="h-10 w-10 rounded-full" src={participant.player.avatar_url} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-brainblitz-primary/10 flex items-center justify-center text-brainblitz-primary font-bold">
                                {participant.player_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{participant.player_name}</div>
                            <div className="text-sm text-gray-500">{participant.player?.username || "Guest"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{participant.quiz_title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{participant.score}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{participant.session_date}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          participant.completed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {participant.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredParticipants.length === 0 && searchQuery && (
              <div className="py-12 text-center text-brainblitz-dark-gray">
                No participants match your search. Try a different query.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ParticipantsPage;
