import { supabase } from '../supabase/client';

export async function checkSupabaseConnection() {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' });
    
    if (error) {
      throw error;
    }
    
    return { success: true, message: 'Supabase connection successful' };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { success: false, message: 'Failed to connect to Supabase', error };
  }
}