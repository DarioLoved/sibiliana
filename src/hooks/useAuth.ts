import { useState, useEffect } from 'react';
import { User } from '../types';
import { AuthService } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const user = await AuthService.signInWithEmail(email, password);
    setUser(user);
    return user;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const user = await AuthService.signUpWithEmail(email, password, name);
    setUser(user);
    return user;
  };

  const signInWithGoogle = async () => {
    const user = await AuthService.signInWithGoogle();
    setUser(user);
    return user;
  };

  const signOut = async () => {
    await AuthService.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
  };
}