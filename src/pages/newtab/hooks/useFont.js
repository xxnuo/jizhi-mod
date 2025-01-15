import { useState, useCallback, useEffect } from "react";
import { FONTNAME_LIST } from "../services/constants";

export function useFont() {
  const [fontIndex, setFontIndex] = useState(() => Number.parseInt(localStorage.getItem("fontIndex") || "0", 10));

  useEffect(() => {
    localStorage.setItem("fontIndex", fontIndex.toString());
  }, [fontIndex]);

  const toggleFont = useCallback(() => {
    setFontIndex((prevIndex) => (prevIndex + 1) % FONTNAME_LIST.length);
  }, []);

  return { fontIndex, toggleFont, currentFont: FONTNAME_LIST[fontIndex] };
} 