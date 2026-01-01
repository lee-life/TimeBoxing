import { useState, useEffect } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabaseClient, isSupabaseConfigured } from '../services/supabase';

interface AuthState {
  user: User | null;
  fighterName: string | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    fighterName: null,
    loading: true,
    error: null,
  });

  // Check if using Supabase or localStorage fallback
  const useSupabase = isSupabaseConfigured();

  useEffect(() => {
    if (!useSupabase) {
      // localStorage fallback mode
      const savedName = sessionStorage.getItem('current_fighter_name');
      setAuthState({
        user: null,
        fighterName: savedName,
        loading: false,
        error: null,
      });
      return;
    }

    // Supabase mode - get initial session
    if (!supabaseClient) {
      setAuthState({
        user: null,
        fighterName: null,
        loading: false,
        error: null,
      });
      return;
    }

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('fighter_name')
            .eq('id', session.user.id)
            .single();
          
          setAuthState({
            user: session.user,
            fighterName: profile?.fighter_name || null,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            fighterName: null,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        console.error('Auth error:', err);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: (err as Error).message,
        }));
      }
    };

    getSession();

    // Listen for auth changes
    if (!supabaseClient) return;
    
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('fighter_name')
            .eq('id', session.user.id)
            .single();
          
          setAuthState({
            user: session.user,
            fighterName: profile?.fighter_name || null,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            fighterName: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [useSupabase]);

  // Sign up with email
  const signUp = async (email: string, password: string, fighterName: string) => {
    if (!useSupabase) {
      // localStorage fallback
      const authKey = `timebox_auth_${fighterName}`;
      const storedPin = localStorage.getItem(authKey);
      
      if (storedPin) {
        return { error: { message: 'Fighter name already taken.' } };
      }
      
      localStorage.setItem(authKey, password);
      sessionStorage.setItem('current_fighter_name', fighterName);
      setAuthState(prev => ({ ...prev, fighterName }));
      return { error: null };
    }

    if (!supabaseClient) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { fighter_name: fighterName }
        }
      });

      if (error) throw error;

      return { data, error: null };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  // Sign in with email
  const signIn = async (email: string, password: string) => {
    if (!useSupabase) {
      // localStorage fallback - use email as fighter name
      const fighterName = email.split('@')[0] || email;
      const authKey = `timebox_auth_${fighterName}`;
      const storedPin = localStorage.getItem(authKey);
      
      if (!storedPin) {
        // New user - register
        localStorage.setItem(authKey, password);
        sessionStorage.setItem('current_fighter_name', fighterName);
        setAuthState(prev => ({ ...prev, fighterName }));
        return { error: null };
      }
      
      if (storedPin !== password) {
        return { error: { message: 'Incorrect password.' } };
      }
      
      sessionStorage.setItem('current_fighter_name', fighterName);
      setAuthState(prev => ({ ...prev, fighterName }));
      return { error: null };
    }

    if (!supabaseClient) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  // Legacy login (fighter name + code) - for backward compatibility
  const legacyLogin = async (fighterName: string, code: string) => {
    if (!useSupabase) {
      const authKey = `timebox_auth_${fighterName}`;
      const storedPin = localStorage.getItem(authKey);
      
      if (storedPin) {
        if (storedPin === code) {
          sessionStorage.setItem('current_fighter_name', fighterName);
          setAuthState(prev => ({ ...prev, fighterName }));
          return { error: null };
        } else {
          return { error: { message: 'Fighter name taken. Incorrect Code.' } };
        }
      } else {
        // New user
        localStorage.setItem(authKey, code);
        sessionStorage.setItem('current_fighter_name', fighterName);
        setAuthState(prev => ({ ...prev, fighterName }));
        return { error: null };
      }
    }

    // For Supabase, convert to email format
    const email = `${fighterName.toLowerCase().replace(/\s+/g, '_')}@timefighter.local`;
    
    // Try sign in first
    const signInResult = await signIn(email, code);
    if (!signInResult.error) return signInResult;
    
    // If failed, try sign up
    if (signInResult.error.message?.includes('Invalid login')) {
      return await signUp(email, code, fighterName);
    }
    
    return signInResult;
  };

  // Sign out
  const signOut = async () => {
    if (!useSupabase) {
      sessionStorage.removeItem('current_fighter_name');
      setAuthState({
        user: null,
        fighterName: null,
        loading: false,
        error: null,
      });
      return;
    }

    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
  };

  return {
    ...authState,
    useSupabase,
    signUp,
    signIn,
    signOut,
    legacyLogin,
  };
};

