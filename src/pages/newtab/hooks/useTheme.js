import { useState, useCallback, useEffect } from "react";
import { DARK_THEME, LIGHT_THEME } from "../services/constants";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const value = localStorage.getItem("theme");
      return ["light", "dark", "sync"].includes(value) ? value : "sync";
    } catch {
      return "sync";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch {}
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.setAttribute(
        "data-theme",
        (theme === "sync" ? media.matches : theme === "dark")
          ? DARK_THEME
          : LIGHT_THEME,
      );
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  const toggleTheme = useCallback(
    () =>
      setTheme(
        (value) =>
          ["light", "dark", "sync"][
            (["light", "dark", "sync"].indexOf(value) + 1) % 3
          ],
      ),
    [],
  );
  return { theme, toggleTheme };
}
