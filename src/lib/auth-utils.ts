
import { supabase } from "./supabase";
import { User } from "./types";

// Increase timeout to 15000ms (15 seconds) to give more time for authentication
export const AUTH_TIMEOUT_MS = 15000;

// Helper function to fetch user profile with better error handling
export const fetchUserProfile = async (userId: string): Promise<User | null> => {
  try {
    console.log(`Fetching profile for user ID: ${userId}`);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user profile:', error.message);
      return null;
    }
    
    console.log(`Profile fetch result:`, data ? 'Profile found' : 'No profile found');
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
    if (existingProfile) {
      console.log(`Using existing profile for user ${userId}`);
      return existingProfile;
    }
    
    console.log('Creating default profile for user:', userId);
    console.log('Using metadata:', metadata || 'No metadata provided');
    
    const username = metadata?.username || `user_${userId.substring(0, 8)}`;
    console.log(`Generated username: ${username}`);
    
    const newProfile = {
      id: userId,
      username: username,
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
      
      // Try to fetch again in case profile was created in parallel
      const retryProfile = await fetchUserProfile(userId);
      if (retryProfile) {
        console.log(`Found profile on retry for user ${userId}`);
        return retryProfile;
      }
      
      return null;
    }
    
    console.log(`New profile created:`, data);
    return data;
  } catch (error) {
    console.error('Unexpected error in createDefaultProfile:', error);
    return null;
  }
};
