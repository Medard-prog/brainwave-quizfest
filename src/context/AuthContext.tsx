
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { toast } from "sonner";
import { fetchUserProfile, createDefaultProfile, AUTH_TIMEOUT_MS } from "@/lib/auth-utils";

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
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Refresh user profile data from the database
  const refreshUserProfile = useCallback(async () => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    
    try {
      console.log("Refreshing user profile for ID:", session.user.id);
      const profile = await fetchUserProfile(session.user.id);
      
      if (profile) {
        console.log("Profile found:", profile.username);
        setUser(profile);
      } else {
        // If no profile found, try to create a default one
        console.log("No profile found, creating default profile");
        const newProfile = await createDefaultProfile(
          session.user.id, 
          session.user.user_metadata
        );
        
        if (newProfile) {
          console.log("New profile created:", newProfile.username);
          setUser(newProfile);
        } else {
          console.error("Failed to create or fetch user profile");
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Error in refreshUserProfile:", error);
      setUser(null);
    }
  }, [session]);

  // Initial auth state and subscription setup
  useEffect(() => {
    console.log("AuthProvider initialized");
    let timeoutId: NodeJS.Timeout;
    
    const setupAuth = async () => {
      try {
        setIsLoading(true);
        
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.warn("Auth loading timed out after", AUTH_TIMEOUT_MS, "ms");
          setIsLoading(false);
          setAuthInitialized(true);
        }, AUTH_TIMEOUT_MS);
        
        // Get initial session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        console.log("Initial session:", data.session ? "exists" : "null");
        setSession(data.session);
        
        if (data.session?.user) {
          await refreshUserProfile();
        }
        
        // Clear timeout as we've successfully initialized
        clearTimeout(timeoutId);
        setIsLoading(false);
        setAuthInitialized(true);
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearTimeout(timeoutId);
        setSession(null);
        setUser(null);
        setIsLoading(false);
        setAuthInitialized(true);
      }
    };

    // Setup auth state monitoring
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state change:", event);
      
      try {
        setSession(newSession);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setIsLoading(true);
          if (newSession?.user) {
            await refreshUserProfile();
          }
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setIsLoading(false);
      }
    });

    // Initialize auth
    setupAuth();

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, [refreshUserProfile]);

  // Sign up a new user
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
          data: metadata,
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (error) {
        toast.error("Signup failed", {
          description: error.message,
        });
        return { error };
      }
      
      // Create profile after successful signup
      if (data.user) {
        const profile = await createDefaultProfile(data.user.id, {
          ...metadata,
          username: metadata?.username || `user_${data.user.id.substring(0, 8)}`
        });
        
        if (!profile) {
          console.warn("Could not create profile during signup");
        }
      }
      
      toast.success("Account created!", {
        description: "Please check your email to confirm your account.",
      });
      
      return { error: null };
    } catch (error: unknown) {
      console.error("Error in signUp:", error);
      toast.error("Signup failed", {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      return { error };
    }
  };

  // Sign in an existing user
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error("Login failed", {
          description: error.message,
        });
        setIsLoading(false);
        return { error };
      }
      
      console.log("Sign in successful");
      
      if (data.session?.user) {
        // Refresh user profile after sign in
        await refreshUserProfile();
      }
      
      setIsLoading(false);
      return { error: null };
    } catch (error: unknown) {
      console.error("Error in signIn:", error);
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      setIsLoading(false);
      return { error };
    }
  };

  // Sign out the current user
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear auth state
      setUser(null);
      setSession(null);
      
      toast.success("Logged out successfully");
    } catch (error: unknown) {
      console.error("Error in signOut:", error);
      toast.error("Error signing out", {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password via email
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
      console.error("Error in resetPassword:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      return { error };
    }
  };

  // Update user password
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
      console.error("Error in updatePassword:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
      return { error };
    }
  };

  // Update local user profile state (in-memory only)
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
    refreshUserProfile
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
