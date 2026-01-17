
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChange, signIn, signUp, logout, signInWithGoogle, AuthUser } from '../services/authService';
import { UserProfile } from '../types';
import { db } from '../services/dbService';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { firestore, auth } from '../services/firebaseConfig';

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
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChange(async (user) => {
      setAuthUser(user);
      
      if (user) {
        // 1. Setup real-time listener for the user profile document
        const userDocRef = doc(firestore, 'users', user.uid);
        
        // Ensure doc exists first
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
          const defaultProfile: UserProfile = {
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'New User',
            avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            preferences: [],
            wishlist: [],
            friends: [],
            sentRequests: []
          };
          await setDoc(userDocRef, defaultProfile);
        }

        unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const profile = { id: doc.id, ...doc.data() } as UserProfile;
            setUserProfile(profile);
            db.setCurrentUser(profile);
            setLoading(false);
          }
        }, (error) => {
          console.error("Profile snapshot error:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUserProfile(null);
        db.setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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
