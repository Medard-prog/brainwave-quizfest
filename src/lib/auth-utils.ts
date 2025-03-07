
import { supabase } from "./supabase";
import { User } from "./types";

// Maximum time to wait for authentication to complete before timing out
export const AUTH_TIMEOUT_MS = 5000;

// Helper function to fetch user profile with error handling
export const fetchUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user profile:', error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error in fetchUserProfile:', error);
    return null;
  }
};

// Create a default profile for new users if one doesn't exist
export const createDefaultProfile = async (userId: string, metadata?: any): Promise<User | null> => {
  try {
    // First check if profile already exists to avoid duplicates
    const existingProfile = await fetchUserProfile(userId);
    if (existingProfile) return existingProfile;
    
    console.log('Creating default profile for user:', userId);
    
    const newProfile = {
      id: userId,
      username: metadata?.username || `user_${userId.substring(0, 8)}`,
      first_name: metadata?.first_name || '',
      last_name: metadata?.last_name || '',
      avatar_url: metadata?.avatar_url || '',
      xp: 0,
      is_teacher: false
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Failed to create default profile:', error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error in createDefaultProfile:', error);
    return null;
  }
};
