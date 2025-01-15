import { useState, useCallback, useEffect, useMemo } from "react";
import { DARK_THEME, LIGHT_THEME } from "../services/constants";

export function useTheme() {
  const mediaQuery = useMemo(() => window.matchMedia("(prefers-color-scheme: dark)"), []);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "sync");

  const mediaHandleChange = useCallback((event) => {
    const storedTheme = localStorage.getItem("theme") || "sync";
    if (storedTheme === "sync") {
      document.documentElement.setAttribute("data-theme", event.matches ? DARK_THEME : LIGHT_THEME);
    } else {
      document.documentElement.setAttribute("data-theme", storedTheme === "dark" ? DARK_THEME : LIGHT_THEME);
    }
  }, []);

  useEffect(() => {
    mediaQuery.addEventListener("change", mediaHandleChange);
    return () => mediaQuery.removeEventListener("change", mediaHandleChange);
  }, [mediaQuery, mediaHandleChange]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    mediaHandleChange(mediaQuery);
  }, [theme, mediaHandleChange, mediaQuery]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => ["light", "dark", "sync"][(["light", "dark", "sync"].indexOf(prevTheme) + 1) % 3]);
  }, []);

  return { theme, toggleTheme };
} 