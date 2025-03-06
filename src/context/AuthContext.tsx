
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
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
  const { toast: uiToast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          
          if (session?.user) {
            await fetchUserProfile(session.user);
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          console.log("Auth state change:", event, session?.user?.id);
          setSession(session);
          
          if (event === 'SIGNED_IN' && session?.user) {
            await fetchUserProfile(session.user);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsLoading(false);
          } else {
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error.message);
        setIsLoading(false);
        return;
      }

      if (data) {
        setUser({
          id: data.id,
          email: supabaseUser.email || '',
          username: data.username,
          avatar_url: data.avatar_url,
          first_name: data.first_name,
          last_name: data.last_name,
          is_teacher: data.is_teacher,
          xp: data.xp
        });
      } else {
        // Create a default user profile if none exists
        const defaultProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          username: supabaseUser.email?.split('@')[0] || 'user',
          avatar_url: null,
          first_name: null,
          last_name: null,
          is_teacher: false,
          xp: 0
        };
        setUser(defaultProfile);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { first_name?: string; last_name?: string; username?: string }
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (!error) {
        uiToast({
          title: "Account created!",
          description: "Please check your email to confirm your account.",
        });
        
        toast("Account created!", {
          description: "Please check your email to confirm your account.",
        });
      }
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error("Login failed", {
          description: error.message,
        });
      }
      
      return { error };
    } catch (error: any) {
      toast.error("Login failed", {
        description: error.message,
      });
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Logged out successfully");
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (!error) {
        uiToast({
          title: "Password reset email sent",
          description: "Check your email for the password reset link",
        });
        
        toast("Password reset email sent", {
          description: "Check your email for the password reset link",
        });
      }
      
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (!error) {
        uiToast({
          title: "Password updated",
          description: "Your password has been successfully updated",
        });
        
        toast("Password updated", {
          description: "Your password has been successfully updated",
        });
      }
      
      return { error };
    } catch (error: any) {
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
