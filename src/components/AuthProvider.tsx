"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  status: string;
  points: number;
  rank: number | null;
  authProvider: string;
  initials: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; requiresVerification?: boolean; email?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string; requiresVerification?: boolean; email?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  resendOTP: (email: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

interface RegisterData {
  name: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  address: string;
  birthday?: string;
  telephone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = "";

// Fetch with Supabase session token for backend API calls
async function apiFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const skipAuthChange = useRef(false);
  const { isDark, setThemePreference } = useTheme();
  const themeSyncRef = useRef(false);

  // Fetch app-specific profile from backend
  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          // Sync theme from server preference
          const serverDark = data.user.themePreference !== 'light';
          setThemePreference(serverDark);
          themeSyncRef.current = true;
          return;
        }
      }
    } catch {
      // Profile fetch failed
    }
    setUser(null);
  }, [setThemePreference]);

  useEffect(() => {
    // Check initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          if (skipAuthChange.current) return;
          await fetchProfile();
          setLoading(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
        } else if (event === "TOKEN_REFRESHED" && session) {
          // Session refreshed
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Save theme preference to server when user toggles theme
  useEffect(() => {
    if (!user || !themeSyncRef.current) return;
    const theme = isDark ? 'dark' : 'light';
    apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ themePreference: theme }),
    }).catch(() => {});
  }, [isDark, user]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Supabase returns this when email is not confirmed
        if (error.message.includes("Email not confirmed")) {
          return {
            success: false,
            message: "Please verify your email first. Check your inbox for the code.",
            requiresVerification: true,
            email,
          };
        }
        return { success: false, message: error.message };
      }

      await fetchProfile();
      return { success: true };
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  }, [fetchProfile]);

  const register = useCallback(async (formData: RegisterData) => {
    try {
      // Check username availability
      const checkRes = await fetch(`${API_BASE}/api/auth/check-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formData.username }),
      });
      const checkData = await checkRes.json();
      if (checkData.success && !checkData.available) {
        return { success: false, message: "This username is already taken" };
      }

      // Sign up via Supabase Auth (Confirm email enabled — Supabase sends OTP)
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            surname: formData.surname,
            username: formData.username,
            address: formData.address,
            birthday: formData.birthday || null,
            telephone: formData.telephone || null,
          },
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      // With "Confirm email" enabled, no session is created.
      // Supabase sends the OTP email automatically.
      return {
        success: true,
        message: "Registration successful. Check your email for the verification code.",
        requiresVerification: true,
        email: formData.email,
      };
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string) => {
    try {
      // Verify OTP via Supabase Auth
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (error) {
        return { success: false, message: error.message || "Verification failed" };
      }

      // Supabase confirms the email and creates a session
      // The on_auth_user_verified trigger updates status to 'active'
      await fetchProfile();
      return { success: true, message: "Email verified!" };
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  }, [fetchProfile]);

  const resendOTP = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) return { success: false, message: error.message };
      return { success: true, message: "A new code has been sent to your email." };
    } catch {
      return { success: false, message: "Failed to resend code." };
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, message: error.message };
      return { success: true, message: "Reset code sent to your email." };
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  }, []);

  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string) => {
    try {
      // Verify the recovery OTP — this creates a session
      skipAuthChange.current = true;
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "recovery",
      });
      skipAuthChange.current = false;

      if (verifyError) {
        return { success: false, message: verifyError.message || "Invalid code" };
      }

      // Now update the password (user has a session from verifyOtp)
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        return { success: false, message: updateError.message };
      }

      // Sign out so user logs in fresh with new password
      await supabase.auth.signOut();
      return { success: true, message: "Password reset successfully!" };
    } catch {
      skipAuthChange.current = false;
      return { success: false, message: "Network error. Please try again." };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyOTP,
        resendOTP,
        forgotPassword,
        resetPassword,
        logout,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
