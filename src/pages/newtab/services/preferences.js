// Color data: https://github.com/zerosoul/chinese-colors (MIT, public/licenses/chinese-colors.LICENSE).
import COLOR_GROUPS from "./colors.json";
import { ARTWORKS, FRAMES, POSITIONS, FILLS } from "./artwork";

export const ENGINES = {
  百度: "https://www.baidu.com/s?wd=",
  Google: "https://www.google.com/search?q=",
};
export const BACKGROUNDS = {
  theme: { name: "跟随主题" },
  daily: { name: "每日传统色" },
  yuebai: { name: "月白", light: "#d4e5ef", dark: "#25333d" },
  tianqing: { name: "天青", light: "#c3d7df", dark: "#23393f" },
  dailan: { name: "黛蓝", light: "#b5bfcb", dark: "#252f40" },
  yanzhi: { name: "胭脂", light: "#edc9cb", dark: "#422a31" },
  ...Object.fromEntries(
    COLOR_GROUPS.flatMap((group) =>
      group.colors.map(({ id, name, hex, figure }) => [
        id,
        {
          name,
          group: group.name,
          figure,
          light: hex,
          dark: `#${hex
            .slice(1)
            .match(/../g)
            .map((channel) =>
              Math.round(parseInt(channel, 16) * 0.28 + 24 * 0.72)
                .toString(16)
                .padStart(2, "0"),
            )
            .join("")}`,
        },
      ]),
    ),
  ),
};
export const BACKGROUND_GROUPS = [
  "常用",
  ...COLOR_GROUPS.map((group) => group.name),
];

export function colorInk(hex) {
  const [r, g, b] = hex
    .slice(1)
    .match(/../g)
    .map((channel) => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05)
    ? "#000000"
    : "#ffffff";
}
export const DEFAULTS = {
  vertical: false,
  engine: "百度",
  background: "theme",
  texture: true,
  artwork: "none",
  frame: "none",
  artworkFill: "cover",
  framePosition: "bottom-right",
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
  const movedArtwork =
    Object.hasOwn(FRAMES, value?.artwork) &&
    !Object.hasOwn(ARTWORKS, value?.artwork) &&
    (!Object.hasOwn(FRAMES, value?.frame) || value.frame === "none")
      ? value.artwork
      : undefined;
  const framePosition = movedArtwork
    ? value?.artworkPosition
    : value?.framePosition;
  return {
    artworkFill: Object.hasOwn(FILLS, value?.artworkFill)
      ? value.artworkFill
      : DEFAULTS.artworkFill,
    framePosition: Object.hasOwn(POSITIONS, framePosition)
      ? framePosition
      : DEFAULTS.framePosition,
    artwork: Object.hasOwn(ARTWORKS, value?.artwork)
      ? value.artwork
      : DEFAULTS.artwork,
    frame:
      movedArtwork ||
      (Object.hasOwn(FRAMES, value?.frame) ? value.frame : DEFAULTS.frame),
    vertical: value?.vertical === true,
    texture:
      typeof value?.texture === "boolean" ? value.texture : DEFAULTS.texture,
    engine: Object.hasOwn(ENGINES, value?.engine)
      ? value.engine
      : DEFAULTS.engine,
    background: Object.hasOwn(BACKGROUNDS, value?.background)
      ? value.background
      : DEFAULTS.background,
  };
}
export function selectedBackground(name, date = new Date()) {
  const colors = Object.values(BACKGROUNDS).filter((color) => color.light);
  return name === "daily"
    ? colors[
        Math.floor(
          Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
            86400000,
        ) % colors.length
      ]
    : BACKGROUNDS[name];
}
export function backgroundColor(name, dark, date = new Date()) {
  return selectedBackground(name, date)?.[dark ? "dark" : "light"];
}
