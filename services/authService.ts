import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as updateFirebaseProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from './firebaseConfig';
import { UserProfile } from '../types';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Convert Firebase User to AuthUser
const firebaseUserToAuthUser = (user: FirebaseUser | null): AuthUser | null => {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL
  };
};

// Get or create user profile in Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = doc(firestore, 'users', uid);
    const snap = await getDoc(userDoc);
    
    if (snap.exists()) {
      const data = snap.data() as any;
      return {
        id: uid,
        name: data.name || data.displayName || 'User',
        avatar: data.avatar || data.photoURL || `https://i.pravatar.cc/150?u=${uid}`,
        preferences: data.preferences || [],
        wishlist: data.wishlist || [],
        friends: data.friends || []
      } as UserProfile;
    }
    
    // Check if the current firebase user has info we can use for the default profile
    const currentAuthUser = auth.currentUser;
    
    const defaultProfile: UserProfile = {
      id: uid,
      name: currentAuthUser?.displayName || 'New User',
      avatar: currentAuthUser?.photoURL || `https://i.pravatar.cc/150?u=${uid}`,
      preferences: [],
      wishlist: [],
      friends: []
    };
    
    await setDoc(userDoc, defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<AuthUser> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return firebaseUserToAuthUser(result.user)!;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Sign up with email and password
export const signUp = async (email: string, password: string, displayName?: string): Promise<AuthUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    if (displayName) {
      await updateFirebaseProfile(user, { displayName });
    }
    
    const userProfile: UserProfile = {
      id: user.uid,
      name: displayName || email.split('@')[0],
      avatar: `https://i.pravatar.cc/150?u=${user.uid}`,
      preferences: [],
      wishlist: [],
      friends: []
    };
    
    await setDoc(doc(firestore, 'users', user.uid), userProfile);
    
    return firebaseUserToAuthUser(user)!;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign up');
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return firebaseUserToAuthUser(userCredential.user)!;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign out
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Get current user
export const getCurrentUser = (): AuthUser | null => {
  return firebaseUserToAuthUser(auth.currentUser);
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    callback(firebaseUserToAuthUser(firebaseUser));
  });
};

// Update Firebase Auth profile (name and photoURL)
export const updateAuthProfile = async (displayName?: string, photoURL?: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    const updates: { displayName?: string; photoURL?: string } = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (photoURL !== undefined) updates.photoURL = photoURL;
    
    await updateFirebaseProfile(user, updates);
  } catch (error: any) {
    console.error('Error updating auth profile:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

export { auth };