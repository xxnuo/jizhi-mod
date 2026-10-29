import { beforeEach, expect, test, vi } from "vitest";
import {
  getRandomPoem,
  formatPoem,
  CATEGORIES,
} from "../src/pages/newtab/services/poems";
import { LIBRARY } from "../src/pages/newtab/services/library";
import {
  readPreferences,
  writeStorage,
  backgroundColor,
  ENGINES,
} from "../src/pages/newtab/services/preferences";
import { poemText } from "../src/pages/newtab/services/poems";

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
test("每类均有完整离线内容，随机结果遵守偏好且避免连续重复", () => {
  expect(new Set(LIBRARY.map((poem) => poem.id)).size).toBe(LIBRARY.length);
  for (const category of CATEGORIES) {
    const entries = LIBRARY.filter((poem) => poem.category === category);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    for (const poem of entries)
      for (const key of ["title", "from", "who", "full", "meaning", "bio"])
        expect(poem[key].trim()).not.toBe("");
    for (let index = 0; index < 30; index++) {
      const poem = getRandomPoem([category], entries[0].id);
      expect(poem.category).toBe(category);
      expect(poem.id).not.toBe(entries[0].id);
    }
  }
  expect(getRandomPoem([])).toBeTruthy();
});
test("损坏和越界设置安全回退，存储失败不抛错", () => {
  localStorage.setItem("preferences", "{");
  expect(readPreferences().engine).toBe("Bing");
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
    categories: CATEGORIES,
    engine: "Bing",
    background: "theme",
    vertical: false,
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  expect(writeStorage("favorites", [])).toBe(false);
});
test("复制保留原文及出处，排版不丢失标点", () => {
  expect(poemText(LIBRARY[0])).toBe(`${LIBRARY[0].title}\n——李白《静夜思》`);
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

test("默认 Bing 和宣纸纹理，保留已有明确偏好，忽略旧繁体开关", () => {
  expect(readPreferences()).toMatchObject({ engine: "Bing", texture: true });
  localStorage.setItem(
    "preferences",
    JSON.stringify({ engine: "Google", texture: false, traditional: true }),
  );
  expect(readPreferences()).toMatchObject({ engine: "Google", texture: false });
  expect(readPreferences()).not.toHaveProperty("traditional");
  localStorage.setItem("preferences", JSON.stringify({ texture: "false" }));
  expect(readPreferences().texture).toBe(true);
});
