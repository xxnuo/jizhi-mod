import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { BACKGROUNDS } from "../src/pages/newtab/services/preferences";
import {
  CARD_RATIOS,
  CARD_MARGINS,
} from "../src/pages/newtab/services/cardRatios";
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
    "选择卡片比例正在生成图片排版横排竖排边距选择排版和边距再点击比例生成图片" +
    Object.values(CARD_MARGINS)
      .map((margin) => margin.name)
      .join("") +
    Object.values(CARD_RATIOS)
      .map((ratio) => ratio.scene)
      .join("") +
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
