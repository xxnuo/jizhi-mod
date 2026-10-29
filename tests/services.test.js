import SENTENCES from "sentences-bundle/sentences/i.json";
import { beforeEach, expect, test, vi } from "vitest";
import { getRandomPoem, formatPoem } from "../src/pages/newtab/services/poems";
import { LIBRARY } from "../src/pages/newtab/services/library";
import {
  readPreferences,
  writeStorage,
  backgroundColor,
  ENGINES,
  BACKGROUNDS,
  BACKGROUND_GROUPS,
  colorInk,
  selectedBackground,
} from "../src/pages/newtab/services/preferences";
import { poemText } from "../src/pages/newtab/services/poems";
import { readdirSync } from "node:fs";
import {
  ARTWORKS,
  FRAMES,
  artworkFor,
  backgroundRect,
} from "../src/pages/newtab/services/artwork";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
test("拒绝不支持的卡片比例", async () => {
  const { exportPoem } = await import("../src/pages/newtab/services/export");
  for (const ratio of ["1:1", "__proto__", undefined])
    await expect(exportPoem(null, null, false, null, ratio)).rejects.toThrow(
      "不支持的卡片比例",
    );
});
test("大背景与边饰全部可选、无多余素材，旧的小幅配景迁移至边饰", () => {
  expect(artworkFor("none")).toBeUndefined();
  expect(artworkFor("lake").file).toBe("background-hengshan.webp");
  expect(FRAMES).not.toHaveProperty("auto");
  const files = [...Object.values(ARTWORKS), ...Object.values(FRAMES)]
    .filter((item) => item.file)
    .map((item) => item.file);
  expect(new Set(files).size).toBe(files.length);
  expect(readdirSync("public/illustrations").sort()).toEqual([...files].sort());
  expect(FRAMES).not.toHaveProperty("eaves");
  expect(FRAMES).not.toHaveProperty("mountains");
  expect(ARTWORKS.mist).toMatchObject({
    name: "远山",
    file: "background-qunshan.webp",
  });
  for (const preferences of [
    { frame: "mountains" },
    { artwork: "mountains" },
  ]) {
    localStorage.setItem("preferences", JSON.stringify(preferences));
    expect(readPreferences()).toMatchObject({ artwork: "mist", frame: "none" });
  }
  localStorage.setItem(
    "preferences",
    JSON.stringify({ artwork: "lake", frame: "mountains" }),
  );
  expect(readPreferences()).toMatchObject({ artwork: "lake", frame: "none" });
  for (const color of Object.values(BACKGROUNDS))
    expect(color).not.toHaveProperty("figure");
  localStorage.setItem(
    "preferences",
    JSON.stringify({
      artwork: "lotus",
      artworkPosition: "top-left",
      frame: "none",
    }),
  );
  expect(readPreferences()).toMatchObject({
    artwork: "none",
    frame: "lotus",
    framePosition: "top-left",
    artworkFill: "cover",
  });
  localStorage.setItem(
    "preferences",
    JSON.stringify({
      artwork: "lotuspond",
      artworkPosition: "top-right",
      frame: "none",
    }),
  );
  expect(readPreferences()).toMatchObject({
    artwork: "none",
    frame: "lotuspond",
    framePosition: "top-right",
  });
  localStorage.setItem(
    "preferences",
    JSON.stringify({ artwork: "moon", frame: "eaves" }),
  );
  expect(readPreferences()).toMatchObject({ artwork: "none", frame: "moon" });
  localStorage.setItem(
    "preferences",
    JSON.stringify({
      artwork: "lotus",
      frame: "plum",
      framePosition: "bottom-left",
    }),
  );
  expect(readPreferences()).toMatchObject({
    artwork: "none",
    frame: "plum",
    framePosition: "bottom-left",
  });
  localStorage.setItem(
    "preferences",
    JSON.stringify({
      artwork: "__proto__",
      frame: "constructor",
      artworkFill: "__proto__",
      framePosition: "left",
    }),
  );
  expect(readPreferences()).toMatchObject({
    artwork: "none",
    frame: "none",
    artworkFill: "cover",
    framePosition: "bottom-right",
  });
  for (const frame of ["auto", "eaves", "lantern", "papercut"]) {
    localStorage.setItem("preferences", JSON.stringify({ frame }));
    expect(readPreferences().frame).toBe("none");
  }
  localStorage.setItem(
    "preferences",
    JSON.stringify({ artwork: "auto", frame: "none" }),
  );
  expect(readPreferences()).toMatchObject({ artwork: "none", frame: "none" });
});
test("背景填充几何：裁切铺满、完整显示、拉伸及原尺寸居中", () => {
  expect(backgroundRect(400, 200, 100, 100, "cover")).toEqual({
    x: -50,
    y: 0,
    width: 200,
    height: 100,
  });
  expect(backgroundRect(400, 200, 100, 100, "contain")).toEqual({
    x: 0,
    y: 25,
    width: 100,
    height: 50,
  });
  expect(backgroundRect(400, 200, 100, 100, "fill")).toEqual({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  expect(backgroundRect(400, 200, 100, 100, "none")).toEqual({
    x: -150,
    y: -50,
    width: 400,
    height: 200,
  });
  expect(backgroundRect(200, 400, 100, 100, "cover")).toEqual({
    x: 0,
    y: -50,
    width: 100,
    height: 200,
  });
  expect(backgroundRect(400, 200, 100, 100, "none", 2)).toEqual({
    x: -350,
    y: -150,
    width: 800,
    height: 400,
  });
});
test("传统色分组完整、明暗文字对比达标，旧背景偏好仍然有效", () => {
  expect(BACKGROUND_GROUPS).toHaveLength(10);
  const colors = Object.entries(BACKGROUNDS).filter(([, color]) => color.light);
  expect(colors).toHaveLength(165);
  for (const [id, color] of colors) {
    localStorage.setItem("preferences", JSON.stringify({ background: id }));
    expect(readPreferences().background).toBe(id);
    for (const dark of [false, true]) {
      const hex = backgroundColor(id, dark);
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
      const rgb = hex
        .slice(1)
        .match(/../g)
        .map((channel) => {
          const value = parseInt(channel, 16) / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        });
      const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      const contrast =
        colorInk(hex) === "#000000"
          ? (luminance + 0.05) / 0.05
          : 1.05 / (luminance + 0.05);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  }
  expect(colorInk("#000000")).toBe("#ffffff");
  expect(colorInk("#ffffff")).toBe("#000000");
  const date = new Date(2026, 9, 29);
  expect(backgroundColor("daily", false, date)).toBe(
    selectedBackground("daily", date).light,
  );
});
test("原始词库逐条保留，不替换、不截断正文和出处", () => {
  expect(LIBRARY).toHaveLength(SENTENCES.length);
  expect(LIBRARY.length).toBeGreaterThan(600);
  SENTENCES.forEach((entry, index) => {
    expect(LIBRARY[index]).toEqual({
      id: entry.uuid || String(entry.id),
      title: entry.hitokoto,
      from: entry.from,
      who: entry.from_who || "",
    });
  });
  for (const entry of LIBRARY)
    expect(getRandomPoem(entry.id).id).not.toBe(entry.id);
});
test("损坏和越界设置安全回退，存储失败不抛错", () => {
  localStorage.setItem("preferences", "{");
  expect(readPreferences().engine).toBe("百度");
  localStorage.setItem(
    "preferences",
    JSON.stringify({
      categories: ["未知"],
      background: "__proto__",
      engine: "constructor",
      vertical: "false",
    }),
  );
  expect(readPreferences()).toMatchObject({
    engine: "百度",
    background: "theme",
    vertical: false,
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  expect(writeStorage("favorites", [])).toBe(false);
});
test("复制保留原文及出处，排版不丢失标点", () => {
  expect(poemText(LIBRARY[0])).toBe(
    `${LIBRARY[0].title}\n——${LIBRARY[0].who || "佚名"}《${LIBRARY[0].from}》`,
  );
  expect(formatPoem("知否，知否？应是绿肥红瘦。")).toBe(
    "知否，\n知否？\n应是绿肥红瘦。",
  );
});
test("每日配色按本地日期稳定轮换，深色使用独立配色，搜索参数编码", () => {
  expect(backgroundColor("daily", false, new Date(2026, 0, 1, 1))).toBe(
    backgroundColor("daily", false, new Date(2026, 0, 1, 23)),
  );
  expect(backgroundColor("daily", false, new Date(2026, 0, 2))).not.toBe(
    backgroundColor("daily", false, new Date(2026, 0, 1)),
  );
  expect(backgroundColor("yuebai", true)).not.toBe(
    backgroundColor("yuebai", false),
  );
  expect(backgroundColor("theme", false)).toBeUndefined();
  for (const url of Object.values(ENGINES))
    expect(
      new URL(url + encodeURIComponent("诗 & 月 #")).searchParams
        .values()
        .next().value,
    ).toBe("诗 & 月 #");
});

test("默认百度 和宣纸纹理，保留已有明确偏好，忽略旧繁体开关", () => {
  expect(readPreferences()).toMatchObject({ engine: "百度", texture: true });
  localStorage.setItem(
    "preferences",
    JSON.stringify({ engine: "Google", texture: false, traditional: true }),
  );
  expect(readPreferences()).toMatchObject({ engine: "Google", texture: false });
  expect(readPreferences()).not.toHaveProperty("traditional");
  localStorage.setItem("preferences", JSON.stringify({ texture: "false" }));
  expect(readPreferences().texture).toBe(true);
});

test("仅保留百度和 Google，旧 Bing 和 DuckDuckGo 偏好回退百度", () => {
  expect(Object.keys(ENGINES)).toEqual(["百度", "Google"]);
  for (const engine of ["Bing", "DuckDuckGo"]) {
    localStorage.setItem("preferences", JSON.stringify({ engine }));
    expect(readPreferences().engine).toBe("百度");
  }
});
