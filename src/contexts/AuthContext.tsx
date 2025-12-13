/**
 * AuthContext - Authentication State Management
 * 
 * Provides global authentication state and methods using React Context.
 * Uses Firebase Authentication for email/password auth.
 * 
 * Features:
 * - User state management (current user or null)
 * - Loading state during initial auth check
 * - Email/password signup and login
 * - Logout functionality
 * - Automatic auth state persistence (handled by Firebase)
 * 
 * Usage:
 * 1. Wrap your app with <AuthProvider>
 * 2. Use the useAuth() hook in components to access auth state
 * 
 * Example:
 * const { user, login, logout } = useAuth();
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Type definition for AuthContext value
 * @property user - Current Firebase User object or null if not authenticated
 * @property loading - True while checking initial auth state
 * @property signup - Create new account with email and password
 * @property login - Sign in with email and password
 * @property logout - Sign out the current user
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with undefined default (will be set by provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to access auth context
 * Must be used within an AuthProvider
 * @returns AuthContextType with user state and auth methods
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * AuthProvider Component
 * 
 * Wraps the application and provides authentication context to all children.
 * Listens to Firebase auth state changes and updates context accordingly.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current authenticated user (null if not logged in)
  const [user, setUser] = useState<User | null>(null);
  // Loading state - true until initial auth check completes
  const [loading, setLoading] = useState(true);

  /**
   * Subscribe to Firebase auth state changes
   * This runs once on mount and sets up a listener
   * The listener updates user state whenever auth state changes
   */
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // Initial check complete
    });

    // Cleanup: unsubscribe when component unmounts
    return unsubscribe;
  }, []);

  /**
   * Create a new user account with email and password
   * @param email - User's email address
   * @param password - User's password (min 6 characters)
   */
  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
    // User state will be updated automatically by onAuthStateChanged listener
  };

  /**
   * Sign in an existing user with email and password
   * @param email - User's email address
   * @param password - User's password
   */
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // User state will be updated automatically by onAuthStateChanged listener
  };

  /**
   * Sign out the current user
   * Clears the user session from Firebase
   */
  const logout = async () => {
    await signOut(auth);
    // User state will be set to null by onAuthStateChanged listener
  };

  // Context value object - memoization not needed as provider rarely re-renders
  const value = {
    user,
    loading,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};