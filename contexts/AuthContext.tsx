import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChange, getUserProfile, signIn, signUp, logout, signInWithGoogle, AuthUser } from '../services/authService';
import { UserProfile } from '../types';
import { db } from '../services/dbService';

interface AuthContextType {
  authUser: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setAuthUser(user);
      
      if (user) {
        // Load user profile from Firestore
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        // Update dbService with current user
        if (profile) {
          db.setCurrentUser(profile);
        }
      } else {
        setUserProfile(null);
        db.setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    await signIn(email, password);
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleSignUp = async (email: string, password: string, displayName?: string) => {
    await signUp(email, password, displayName);
  };

  const handleSignOut = async () => {
    await logout();
    setUserProfile(null);
  };

  const value: AuthContextType = {
    authUser,
    userProfile,
    loading,
    signIn: handleSignIn,
    signInWithGoogle: handleGoogleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};