import { useState, useCallback, useEffect } from "react";
import { FONTNAME_LIST } from "../services/constants";

export function useFont() {
  const [fontIndex, setFontIndex] = useState(() => {
    try {
      const index = Number(localStorage.getItem("fontIndex") || 0);
      return Number.isInteger(index) &&
        index >= 0 &&
        index < FONTNAME_LIST.length
        ? index
        : 0;
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("fontIndex", String(fontIndex));
    } catch {}
  }, [fontIndex]);
  const toggleFont = useCallback(
    () => setFontIndex((index) => (index + 1) % FONTNAME_LIST.length),
    [],
  );
  return { fontIndex, toggleFont, currentFont: FONTNAME_LIST[fontIndex] };
}
