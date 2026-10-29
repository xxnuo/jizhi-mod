import { useState, useEffect } from "react";
import { LIBRARY } from "../services/library";
import { readStorage, writeStorage } from "../services/preferences";

function readIds(key, limit) {
  const ids = readStorage(key, []);
  return Array.isArray(ids)
    ? [...new Set(ids)].filter((id) => typeof id === "string").slice(0, limit)
    : [];
}
export function useLibrary(poem, onError) {
  const [favorites, setFavorites] = useState(() =>
    readIds("favorites", LIBRARY.length),
  );
  const [history, setHistory] = useState(() => readIds("history", 100));
  useEffect(() => {
    setHistory((previous) => {
      const next = [poem.id, ...previous.filter((id) => id !== poem.id)].slice(
        0,
        100,
      );
      if (!writeStorage("history", next))
        onError("历史无法保存，浏览器存储空间不可用");
      return next;
    });
  }, [poem.id, onError]);
  function toggleFavorite() {
    const next = favorites.includes(poem.id)
      ? favorites.filter((id) => id !== poem.id)
      : [poem.id, ...favorites];
    if (!writeStorage("favorites", next))
      onError("收藏无法保存，浏览器存储空间不可用");
    setFavorites(next);
  }
  return { favorites, history, toggleFavorite };
}
