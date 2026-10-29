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
import { displayPoem, poemText } from "../src/pages/newtab/services/text";

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
  expect(readPreferences().engine).toBe("Google");
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
    engine: "Google",
    background: "theme",
    vertical: false,
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  expect(writeStorage("favorites", [])).toBe(false);
});
test("繁简转换覆盖正文出处作者，复制保留出处，标点不丢失", () => {
  const source = { ...LIBRARY[0], title: "举头望明月，低头思故乡。" };
  const converted = displayPoem(source, true);
  expect(converted.title).toBe("舉頭望明月，低頭思故鄉。");
  expect(converted.from).toBe("靜夜思");
  expect(converted.id).toBe(source.id);
  expect(source.title).toContain("举");
  expect(poemText(converted)).toContain("——李白《靜夜思》");
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
