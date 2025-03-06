
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, User, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const SettingsPage = () => {
  const { user, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    avatar_url: "",
  });
  const [notifications, setNotifications] = useState({
    email_notifications: false,
    quiz_results: false,
    new_features: false,
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchProfileData = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setProfile({
          username: data.username || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: user.email || "",
          avatar_url: data.avatar_url || "",
        });
        
        setNotifications({
          email_notifications: data.email_notifications || false,
          quiz_results: data.quiz_results_notifications || false,
          new_features: data.new_features_notifications || false,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update user data in AuthContext
      updateUserProfile({
        username: profile.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: profile.avatar_url,
      });
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationUpdate = async (setting: string, value: boolean) => {
    if (!user) return;
    
    try {
      const updates: any = {};
      
      switch (setting) {
        case "email_notifications":
          updates.email_notifications = value;
          setNotifications({ ...notifications, email_notifications: value });
          break;
        case "quiz_results":
          updates.quiz_results_notifications = value;
          setNotifications({ ...notifications, quiz_results: value });
          break;
        case "new_features":
          updates.new_features_notifications = value;
          setNotifications({ ...notifications, new_features: value });
          break;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast.success("Notification settings updated");
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings");
    }
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
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-brainblitz-dark-gray mt-1">
            Manage your account settings and preferences
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={20} className="text-brainblitz-primary" />
                  Profile Settings
                </CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile.avatar_url || ""} />
                      <AvatarFallback className="bg-brainblitz-primary text-white text-lg">
                        {profile.first_name && profile.last_name 
                          ? `${profile.first_name[0]}${profile.last_name[0]}`
                          : profile.username?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-brainblitz-dark-gray mb-2">
                        Profile photos help personalize your account
                      </p>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm">
                          Change Photo
                        </Button>
                        {profile.avatar_url && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setProfile({ ...profile, avatar_url: "" })}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input 
                        id="first_name" 
                        value={profile.first_name} 
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input 
                        id="last_name" 
                        value={profile.last_name} 
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value={profile.username} 
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile.email} 
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-brainblitz-dark-gray">
                      Email cannot be changed. Please contact support for assistance.
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell size={20} className="text-brainblitz-primary" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Control which notifications you receive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-brainblitz-dark-gray">
                        Receive email notifications
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email_notifications} 
                      onCheckedChange={(checked) => handleNotificationUpdate("email_notifications", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">Quiz Results</h4>
                      <p className="text-sm text-brainblitz-dark-gray">
                        Get notified when participants complete your quizzes
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.quiz_results} 
                      onCheckedChange={(checked) => handleNotificationUpdate("quiz_results", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">New Features</h4>
                      <p className="text-sm text-brainblitz-dark-gray">
                        Stay updated with new features and improvements
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.new_features} 
                      onCheckedChange={(checked) => handleNotificationUpdate("new_features", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield size={20} className="text-brainblitz-primary" />
                  Security
                </CardTitle>
                <CardDescription>
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Password</h4>
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                </div>
                
                <div className="pt-4">
                  <h4 className="font-medium mb-2 text-red-500">Danger Zone</h4>
                  <Button variant="destructive" className="w-full">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
