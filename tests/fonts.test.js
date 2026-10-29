import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { BACKGROUNDS } from "../src/pages/newtab/services/preferences";
import {
  ARTWORKS,
  FRAMES,
  POSITIONS,
  FILLS,
} from "../src/pages/newtab/services/artwork";

test("生成字体覆盖全部传统色名与新增配景、边饰文案", () => {
  const base = "assets/fonts/build";
  const ranges = readdirSync(base).flatMap((folder) => {
    const css = readFileSync(`${base}/${folder}/result.css`, "utf8");
    return css
      .match(/unicode-range:([^;]+)/)[1]
      .split(",")
      .map((range) => {
        const [start, end = start] = range.replace("U+", "").split("-");
        return [parseInt(start, 16), parseInt(end, 16)];
      });
  });
  const text =
    "色调国画配图画面边饰填充样式边饰位置" +
    Object.values(POSITIONS).join("") +
    Object.values(FILLS).join("") +
    [
      ...Object.values(BACKGROUNDS),
      ...Object.values(ARTWORKS),
      ...Object.values(FRAMES),
    ]
      .map((item) => item.name)
      .join("");
  for (const character of new Set(text)) {
    const point = character.codePointAt(0);
    expect(
      ranges.some(([start, end]) => point >= start && point <= end),
      character,
    ).toBe(true);
  }
});
