"use client";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setThemePreference: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: true, toggleTheme: () => {}, setThemePreference: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const initializedFromServer = useRef(false);

  useEffect(() => {
    // Only use localStorage if server hasn't set the preference yet
    if (initializedFromServer.current) return;
    const saved = localStorage.getItem("theme");
    if (saved) {
      setIsDark(saved === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  const setThemePreference = useCallback((dark: boolean) => {
    initializedFromServer.current = true;
    setIsDark(dark);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
