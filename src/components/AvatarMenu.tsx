
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User, BarChart3, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface AvatarMenuProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

const AvatarMenu = ({ user }: AvatarMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  // This would be replaced by actual auth logic
  const isLoggedIn = !!user;
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };
  
  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-4">
        <Link 
          to="/login"
          className="text-brainblitz-text hover:text-brainblitz-primary transition-colors"
        >
          Log in
        </Link>
        <Link 
          to="/register"
          className="bg-brainblitz-primary text-white px-4 py-2 rounded-xl hover:bg-brainblitz-primary/90 transition-all"
        >
          Sign up
        </Link>
      </div>
    );
  }
  
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "U";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-9 w-9 border-2 border-transparent hover:border-brainblitz-primary transition-all">
          <AvatarImage src={user?.avatar} alt={user?.name} />
          <AvatarFallback className="bg-brainblitz-primary text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 animate-scale">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="cursor-pointer flex items-center gap-2">
            <User size={16} />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/analytics" className="cursor-pointer flex items-center gap-2">
            <BarChart3 size={16} />
            <span>Analytics</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/participants" className="cursor-pointer flex items-center gap-2">
            <Users size={16} />
            <span>Participants</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/settings" className="cursor-pointer flex items-center gap-2">
            <Settings size={16} />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-rose-500 hover:text-rose-600 focus:text-rose-600 flex items-center gap-2"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AvatarMenu;
