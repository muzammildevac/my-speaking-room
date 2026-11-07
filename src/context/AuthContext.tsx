'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, ProficiencyLevel } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { realtimeBus } from '@/lib/sync/realtime-bus';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  signUpWithEmail: (email: string, password?: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  loginQuickUser: (userPreset: { name: string; native: string; learning: string; level: ProficiencyLevel; avatar?: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'msr_current_user';
const LOCAL_STORAGE_PROFILE_KEY = 'msr_current_profile';

const DEMO_USERS = [
  { name: 'Elena Rostova', native: 'Russian', learning: 'English', level: 'B2 - Upper Intermediate' as ProficiencyLevel, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Mateo Garcia', native: 'Spanish', learning: 'French', level: 'B1 - Intermediate' as ProficiencyLevel, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Kenji Sato', native: 'Japanese', learning: 'English', level: 'A2 - Elementary' as ProficiencyLevel, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { name: 'Amira Benali', native: 'Arabic', learning: 'English', level: 'C1 - Advanced' as ProficiencyLevel, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { name: 'Lucas Silva', native: 'Portuguese', learning: 'German', level: 'B1 - Intermediate' as ProficiencyLevel, avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    async function initAuth() {
      if (isConfigured) {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email || '' });
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (prof) {
              setProfile(prof);
            } else {
              const defaultProf: Profile = {
                id: session.user.id,
                display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Learner',
                avatar_url: session.user.user_metadata?.avatar_url || '',
                native_language: 'English',
                learning_language: 'Spanish',
                proficiency_level: 'B1 - Intermediate',
              };
              await supabase.from('profiles').insert(defaultProf);
              setProfile(defaultProf);
            }
          }
        } catch (err) {
          console.error('Supabase auth init error', err);
        }
      } else {
        // Local mode fallback
        const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        const savedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);

        if (savedUser && savedProfile) {
          try {
            setUser(JSON.parse(savedUser));
            setProfile(JSON.parse(savedProfile));
          } catch {
            createDefaultDemoUser();
          }
        } else {
          createDefaultDemoUser();
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, [isConfigured]);

  const createDefaultDemoUser = () => {
    // Pick random demo profile for easy testing
    const randomUser = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
    const generatedId = 'user_' + Math.random().toString(36).substring(2, 9);
    const initialUser = { id: generatedId, email: `${randomUser.name.toLowerCase().replace(' ', '.')}@example.com` };
    const initialProfile: Profile = {
      id: generatedId,
      display_name: randomUser.name,
      avatar_url: randomUser.avatar,
      native_language: randomUser.native,
      learning_language: randomUser.learning,
      proficiency_level: randomUser.level,
      created_at: new Date().toISOString()
    };

    setUser(initialUser);
    setProfile(initialProfile);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(initialUser));
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(initialProfile));
  };

  const loginWithGoogle = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
    } else {
      // Simulate Google login
      const googleUser = {
        id: 'usr_g_' + Math.random().toString(36).substring(2, 9),
        email: 'alex.speaker@gmail.com'
      };
      const googleProfile: Profile = {
        id: googleUser.id,
        display_name: 'Alex Rivera',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        native_language: 'Spanish',
        learning_language: 'English',
        proficiency_level: 'B2 - Upper Intermediate',
        created_at: new Date().toISOString()
      };
      setUser(googleUser);
      setProfile(googleProfile);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(googleUser));
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(googleProfile));
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    if (isConfigured) {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || 'TestPass123!',
      });
      if (error) throw error;
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || '' });
      }
    } else {
      const cleanName = email.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      const emailUser = { id: 'usr_' + Math.random().toString(36).substring(2, 9), email };
      const emailProfile: Profile = {
        id: emailUser.id,
        display_name: formattedName || 'Language Learner',
        avatar_url: '',
        native_language: 'English',
        learning_language: 'Spanish',
        proficiency_level: 'B1 - Intermediate',
        created_at: new Date().toISOString()
      };
      setUser(emailUser);
      setProfile(emailProfile);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(emailUser));
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(emailProfile));
    }
  };

  const signUpWithEmail = async (email: string, password?: string, displayName?: string) => {
    if (isConfigured) {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || 'TestPass123!',
        options: {
          data: {
            full_name: displayName || email.split('@')[0],
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || '' });
      }
    } else {
      await loginWithEmail(email, password);
      if (displayName) {
        await updateProfile({ display_name: displayName });
      }
    }
  };

  const logout = async () => {
    if (isConfigured) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    setProfile(updated);

    if (isConfigured) {
      const supabase = createClient();
      await supabase.from('profiles').update(updates).eq('id', profile.id);
    } else {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
    }

    realtimeBus?.emit('profile_updated', updated);
  };

  const loginQuickUser = (userPreset: { name: string; native: string; learning: string; level: ProficiencyLevel; avatar?: string }) => {
    const quickId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const quickUser = { id: quickId, email: `${userPreset.name.toLowerCase().replace(/\s+/g, '.')}@language.voice` };
    const quickProfile: Profile = {
      id: quickId,
      display_name: userPreset.name,
      avatar_url: userPreset.avatar || '',
      native_language: userPreset.native,
      learning_language: userPreset.learning,
      proficiency_level: userPreset.level,
      created_at: new Date().toISOString()
    };

    setUser(quickUser);
    setProfile(quickProfile);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(quickUser));
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(quickProfile));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isConfigured,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logout,
        updateProfile,
        loginQuickUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
