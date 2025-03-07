
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string; username?: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  updateUserProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authAttempts, setAuthAttempts] = useState(0);

  // Create default profile when none exists
  const createDefaultProfile = async (userId: string): Promise<User | null> => {
    console.log("Creating default profile for user:", userId);
    
    try {
      const defaultUsername = `user_${Math.random().toString(36).substring(2, 7)}`;
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: defaultUsername,
          is_teacher: false,
          xp: 0
        })
        .select('*')
        .single();
      
      if (error) {
        console.error("Error creating default profile:", error);
        toast.error("Failed to create user profile");
        return null;
      }
      
      console.log("Default profile created successfully:", data);
      return data;
    } catch (error: any) {
      console.error("Exception creating default profile:", error.message);
      return null;
    }
  };

  // Improved user profile fetching with fallback
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    console.log(`Fetching profile for user: ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching profile:", error.message);
        return null;
      }
      
      if (!data) {
        console.log("No profile found, creating default profile");
        return await createDefaultProfile(userId);
      }
      
      console.log("Profile fetched successfully");
      return data;
    } catch (error: any) {
      console.error("Exception in fetchUserProfile:", error.message);
      return null;
    }
  };

  useEffect(() => {
    console.log("AuthProvider mounted");
    
    // Initial session check
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        console.log("Getting initial session...");
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        console.log("Initial session:", data.session ? "exists" : "null");
        setSession(data.session);
        
        if (data.session?.user) {
          const profile = await fetchUserProfile(data.session.user.id);
          console.log("Initial profile:", profile ? "loaded" : "null");
          setUser(profile);
          
          // Handle missing profile
          if (!profile) {
            console.warn("No profile found for authenticated user, creating default");
            const newProfile = await createDefaultProfile(data.session.user.id);
            setUser(newProfile);
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        toast.error("Authentication error", { 
          description: "Failed to load user session. Please try again."
        });
      } finally {
        setIsLoading(false);
        console.log("Initial auth loading completed");
      }
    };

    getInitialSession();
    
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state change:", event);
        
        setSession(newSession);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            setIsLoading(true);
            const profile = await fetchUserProfile(newSession.user.id);
            
            if (!profile) {
              const newProfile = await createDefaultProfile(newSession.user.id);
              setUser(newProfile);
            } else {
              setUser(profile);
            }
            
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    // Auth attempt recovery - if loading for too long, force reset
    const authTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Auth loading timeout reached, forcing reset");
        setIsLoading(false);
        setAuthAttempts(prev => prev + 1);
        
        if (authAttempts > 2) {
          // Clear supabase session from local storage after multiple failures
          localStorage.removeItem('supabase.auth.token');
          toast.error("Authentication error", {
            description: "Session reset due to loading issues. Please sign in again."
          });
        }
      }
    }, 5000); // 5 second timeout

    // Cleanup
    return () => {
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [authAttempts]);

  // Debug state changes
  useEffect(() => {
    console.log("Auth state:", {
      isLoading,
      hasSession: !!session,
      hasUser: !!user
    });
  }, [isLoading, session, user]);

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { first_name?: string; last_name?: string; username?: string }
  ) => {
    try {
      setIsLoading(true);
      console.log("Starting signup process");
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) {
        toast.error("Signup failed", {
          description: error.message,
        });
        return { error };
      }
      
      console.log("Auth signup successful, creating profile");
      
      // Explicitly create profile after signup
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: metadata?.username || `user_${Math.random().toString(36).substring(2, 7)}`,
            first_name: metadata?.first_name || '',
            last_name: metadata?.last_name || '',
            is_teacher: false,
            xp: 0
          });
          
        if (profileError) {
          console.error("Error creating profile:", profileError);
          toast.error("Account created but profile setup failed", {
            description: "You may need to update your profile information later."
          });
        }
      }
      
      toast.success("Account created!", {
        description: "Please check your email to confirm your account.",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error("Signup exception:", error);
      toast.error("Signup failed", {
        description: error.message,
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("Signing in with:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error("Login failed", {
          description: error.message,
        });
        return { error };
      }
      
      console.log("Sign in successful");
      
      if (data.session?.user) {
        const profile = await fetchUserProfile(data.session.user.id);
        
        if (!profile) {
          console.warn("No profile found after login, creating default");
          const newProfile = await createDefaultProfile(data.session.user.id);
          setUser(newProfile);
        } else {
          setUser(profile);
        }
      }
      
      return { error: null };
    } catch (error: any) {
      console.error("Login exception:", error);
      toast.error("Login failed", {
        description: error.message,
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      toast.success("Logged out successfully");
      
      // Clear any potential corrupted state
      localStorage.removeItem('supabase.auth.token');
    } catch (error: any) {
      console.error("Signout error:", error);
      toast.error("Error signing out", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (!error) {
        toast.success("Password reset email sent", {
          description: "Check your email for the password reset link",
        });
      } else {
        toast.error("Failed to send reset email", {
          description: error.message,
        });
      }
      
      return { error };
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error("Error", {
        description: error.message,
      });
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (!error) {
        toast.success("Password updated", {
          description: "Your password has been successfully updated",
        });
      } else {
        toast.error("Failed to update password", {
          description: error.message,
        });
      }
      
      return { error };
    } catch (error: any) {
      console.error("Update password error:", error);
      toast.error("Error", {
        description: error.message,
      });
      return { error };
    }
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...data });
  };

  const value = {
    session,
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
