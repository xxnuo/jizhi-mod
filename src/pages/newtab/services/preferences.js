import { CATEGORIES } from "./poems";

export const ENGINES = {
  Google: "https://www.google.com/search?q=",
  百度: "https://www.baidu.com/s?wd=",
  Bing: "https://www.bing.com/search?q=",
  DuckDuckGo: "https://duckduckgo.com/?q=",
};
export const BACKGROUNDS = {
  theme: { name: "跟随主题" },
  daily: { name: "每日传统色" },
  yuebai: { name: "月白", light: "#d4e5ef", dark: "#25333d" },
  tianqing: { name: "天青", light: "#c3d7df", dark: "#23393f" },
  dailan: { name: "黛蓝", light: "#b5bfcb", dark: "#252f40" },
  yanzhi: { name: "胭脂", light: "#edc9cb", dark: "#422a31" },
};
export const DEFAULTS = {
  vertical: false,
  engine: "Bing",
  background: "theme",
  texture: true,
  categories: CATEGORIES,
};
export function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function readPreferences() {
  const value = readStorage("preferences", {});
  const categories = Array.isArray(value?.categories)
    ? CATEGORIES.filter((category) => value.categories.includes(category))
    : CATEGORIES;
  return {
    vertical: value?.vertical === true,
    texture:
      typeof value?.texture === "boolean" ? value.texture : DEFAULTS.texture,
    engine: Object.hasOwn(ENGINES, value?.engine)
      ? value.engine
      : DEFAULTS.engine,
    background: Object.hasOwn(BACKGROUNDS, value?.background)
      ? value.background
      : DEFAULTS.background,
    categories: categories.length ? categories : CATEGORIES,
  };
}
export function backgroundColor(name, dark, date = new Date()) {
  const colors = Object.values(BACKGROUNDS).filter((color) => color.light);
  const color =
    name === "daily"
      ? colors[
          Math.floor(
            Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
              86400000,
          ) % colors.length
        ]
      : BACKGROUNDS[name];
  return color?.[dark ? "dark" : "light"];
}
