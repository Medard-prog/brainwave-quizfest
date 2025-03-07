import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User as SupabaseUser, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string; username?: string }) => Promise<{ error: unknown | null }>;
  signIn: (email: string, password: string) => Promise<{ error: unknown | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: unknown | null }>;
  updatePassword: (password: string) => Promise<{ error: unknown | null }>;
  updateUserProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simplified user profile fetching
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error.message);
        return null;
      }
      
      return data;
    } catch (error: unknown) {
      console.error('Error in fetchUserProfile:', error instanceof Error ? error.message : 'Unknown error');
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
        } else {
          // Explicitly set user to null when no session exists
          setUser(null);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        // Ensure user is set to null on error
        setUser(null);
        setSession(null);
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
        
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (newSession?.user) {
              setIsLoading(true);
              const profile = await fetchUserProfile(newSession.user.id);
              if (profile) {
                setUser(profile);
              } else {
                console.error("Failed to fetch user profile after auth state change");
                setUser(null);
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        } catch (error) {
          console.error("Error in auth state change handler:", error);
          // Reset auth state on error
          setUser(null);
        } finally {
          // Ensure loading state is always turned off
          setIsLoading(false);
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { first_name?: string; last_name?: string; username?: string }
  ) => {
    try {
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
      
      toast.success("Account created!", {
        description: "Please check your email to confirm your account.",
      });
      
      return { error: null };
    } catch (error: unknown) {
      toast.error("Signup failed", {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      return { error };
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
        if (profile) {
          setUser(profile);
        }
      }
      
      return { error: null };
    } catch (error: unknown) {
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
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
    } catch (error: unknown) {
      toast.error("Error signing out", {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
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
    } catch (error: unknown) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
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
    } catch (error: unknown) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
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
