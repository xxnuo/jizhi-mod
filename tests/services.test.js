import SENTENCES from "sentences-bundle/sentences/i.json";
import { beforeEach, expect, test, vi } from "vitest";
import { getRandomPoem, formatPoem } from "../src/pages/newtab/services/poems";
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
