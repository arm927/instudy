"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      const { data, error } =
        await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error("Auth initialization:", error.message);
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!mounted) return;

        // OPTIMIZATION: Only update state if the user actually changed 
        // (prevents background token refreshes from triggering re-renders)
        setSession((prevSession) => {
          if (prevSession?.user?.id === currentSession?.user?.id) {
            return prevSession; // Keep exact same reference, stops re-renders
          }
          return currentSession;
        });

        setUser((prevUser) => {
          if (prevUser?.id === currentSession?.user?.id) {
            return prevUser; // Keep exact same reference
          }
          return currentSession?.user ?? null;
        });

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}