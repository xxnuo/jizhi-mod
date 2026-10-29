const SENTENCES = require("sentences-bundle/sentences/i.json");
const { tool, selectBackground, selectDecoration } = require("./helpers");
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/newtab.html");
  await expect(page.locator(".poem-title")).toBeVisible();
});
async function settings(page) {
  await tool(page, "设置");
}
async function close(page) {
  await page.getByRole("button", { name: "关闭", exact: true }).click();
}

test("大幅国画和全部边饰逐张预览，四角定位和填充样式保存", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await settings(page);
  await expect(page.getByLabel("配景位置")).toHaveCount(0);
  await expect(page.getByLabel("填充样式").locator("option")).toHaveCount(4);
  await expect(page.getByLabel("边饰位置").locator("option")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "瓦檐", exact: true }),
  ).toHaveCount(0);
  for (const [label, selector, count] of [
    ["国画配图", ".background-artwork", 7],
    ["画面边饰", ".background-frame", 37],
  ]) {
    const picker = page.getByRole("group", { name: label, exact: true });
    const buttons = picker.locator("button:has(img)");
    await expect(buttons).toHaveCount(count);
    for (const button of await buttons.all()) {
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
      const image = button.locator("img");
      await expect
        .poll(() => image.evaluate((el) => el.complete && el.naturalWidth > 0))
        .toBe(true);
      const size = await image.evaluate((el) =>
        Math.max(el.naturalWidth, el.naturalHeight),
      );
      if (label === "国画配图") expect(size).toBeGreaterThanOrEqual(1000);
      else expect(size).toBeLessThanOrEqual(512);
      await expect(page.locator(selector)).toHaveAttribute(
        "src",
        await image.getAttribute("src"),
      );
    }
    await picker.locator(".image-options").evaluate((el) => {
      el.scrollTop = 0;
    });
    await picker.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/gallery-${selector.slice(1)}.png`,
    });
  }
  await selectDecoration(page, "国画配图", "lake");
  await selectDecoration(page, "画面边饰", "moon");
  await page.getByLabel("填充样式").selectOption("contain");
  await close(page);
  for (const position of [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ]) {
    await settings(page);
    await page.getByLabel("边饰位置").selectOption(position);
    await close(page);
    await expect(page.locator(".background-frame")).toHaveAttribute(
      "data-position",
      position,
    );
    const box = await page.locator(".background-frame").boundingBox();
    expect(position.endsWith("left") ? box.x : box.x + box.width).toBeCloseTo(
      position.endsWith("left") ? 0 : 1280,
      0,
    );
    expect(position.startsWith("top") ? box.y : box.y + box.height).toBeCloseTo(
      position.startsWith("top") ? 0 : 720,
      0,
    );
  }
  await page.reload();
  await expect(page.locator(".background-artwork")).toHaveCSS(
    "object-fit",
    "contain",
  );
  expect((await page.locator(".background-artwork").boundingBox()).width).toBe(
    1280,
  );
  await page.screenshot({ path: "test-results/full-background-desktop.png" });
  await page.setViewportSize({ width: 375, height: 667 });
  expect((await page.locator(".background-artwork").boundingBox()).width).toBe(
    375,
  );
  expect(
    (await page.locator(".background-frame").boundingBox()).width,
  ).toBeLessThanOrEqual(105);
  await page.screenshot({ path: "test-results/full-background-mobile.png" });
});

test("背景四种填充样式导出不同画面", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  const hashes = new Set();
  for (const fill of ["cover", "contain", "fill", "none"]) {
    await settings(page);
    await selectDecoration(page, "国画配图", "lake");
    await selectDecoration(page, "画面边饰", "none");
    await page.getByLabel("填充样式").selectOption(fill);
    await close(page);
    await expect(page.locator(".background-artwork")).toHaveCSS(
      "object-fit",
      fill,
    );
    const downloaded = page.waitForEvent("download");
    await tool(page, "导出诗词卡片");
    const file = await downloaded;
    const data = require("node:fs").readFileSync(await file.path());
    hashes.add(
      require("node:crypto").createHash("sha256").update(data).digest("hex"),
    );
    await file.saveAs(`test-results/card-background-${fill}.png`);
  }
  expect(hashes.size).toBe(4);
});

test("卡片导出在四个角准确绘制边饰", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];
  for (const [index, position] of positions.entries()) {
    await settings(page);
    await selectBackground(page, "yuebai");
    await page.getByLabel("宣纸纹理").uncheck();
    await selectDecoration(page, "国画配图", "none");
    await selectDecoration(page, "画面边饰", "bamboo");
    await page.getByLabel("边饰位置").selectOption(position);
    await close(page);
    const downloaded = page.waitForEvent("download");
    await tool(page, "导出诗词卡片");
    const file = await downloaded;
    const base64 = require("node:fs")
      .readFileSync(await file.path())
      .toString("base64");
    const counts = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 108;
      canvas.height = 144;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, 108, 144);
      return [
        [0, 0],
        [81, 0],
        [0, 104],
        [81, 104],
      ].map(([x, y]) => {
        const d = ctx.getImageData(x, y, 27, 40).data;
        return new Set(
          Array.from(
            { length: d.length / 4 },
            (_, i) => `${d[i * 4]},${d[i * 4 + 1]},${d[i * 4 + 2]}`,
          ),
        ).size;
      });
    }, base64);
    counts.forEach((count, i) =>
      i === index ? expect(count).toBeGreaterThan(5) : expect(count).toBe(1),
    );
  }
});

test("色调只有一个设置条目，主题、每日色与色签互斥选择", async ({ page }) => {
  await settings(page);
  await expect(
    page.getByRole("group", { name: "色调", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("combobox", { name: "色调", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("中国传统色", { exact: true })).toHaveCount(0);
  await expect(
    page
      .getByRole("group", { name: "画面边饰", exact: true })
      .getByRole("button", { name: "瓦檐", exact: true }),
  ).toHaveCount(0);
  const swatches = page.getByRole("group", { name: "背景色签" });
  await expect(swatches.getByRole("button")).toHaveCount(6);
  await expect(
    swatches.getByRole("button", { name: "跟随主题", exact: true }),
  ).toBeVisible();
  await expect(
    swatches.getByRole("button", { name: "每日传统色", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "色系", exact: true })
    .getByRole("button", { name: "红", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "跟随主题", exact: true }),
  ).toHaveCount(0);
  await selectBackground(page, "daily");
  await close(page);
  await page.reload();
  await settings(page);
  await expect(
    page.getByRole("button", { name: "每日传统色", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await selectBackground(page, "yuebai");
  await expect(
    page.getByRole("button", { name: "每日传统色", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: "选用月白", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await selectBackground(page, "theme");
  await expect(
    page.getByRole("button", { name: "选用月白", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await close(page);
  await expect(page.getByLabel("当前背景色")).toHaveCount(0);
});

test("宣纸使用本地纹理，色名三秒后隐藏、移入恢复，减少动态效果时同样生效", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await settings(page);
  await selectBackground(page, "yuebai");
  await close(page);
  await page.mouse.move(10, 300);
  const caption = page.locator(".background-caption-content");
  await expect(caption).toHaveCSS("opacity", "0.65");
  const texture = await page
    .locator("#app")
    .evaluate(
      (element) => getComputedStyle(element, "::before").backgroundImage,
    );
  expect(texture).toMatch(/chinese-paper.*\.png/);
  const textureUrl = texture.match(/url\("?([^"\)]+)"?\)/)[1];
  expect((await page.request.get(textureUrl)).ok()).toBe(true);
  await expect(caption).toHaveCSS("opacity", "0", { timeout: 5000 });
  await page.screenshot({
    path: "test-results/paper-texture-caption-hidden.png",
  });
  await page.mouse.move(1260, 20);
  await expect(caption).toHaveCSS("opacity", "0.65");
  await page.mouse.move(10, 300);
  await expect(caption).toHaveCSS("opacity", "0");
  await settings(page);
  await selectBackground(page, "tianqing");
  await close(page);
  await expect(caption).toHaveCSS("opacity", "0.65");
  await page.reload();
  await expect(caption).toHaveCSS("opacity", "0.65");
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(caption).toHaveCSS("opacity", "0", { timeout: 5000 });
  await page.screenshot({ path: "test-results/paper-texture-mobile.png" });
});

test("传统色色签分类、明暗适配和持久化，小屏无溢出", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await settings(page);
  await page.getByLabel("宣纸纹理").uncheck();
  await selectDecoration(page, "国画配图", "none");
  const groups = page.getByRole("group", { name: "色系", exact: true });
  await groups.getByRole("button", { name: "红", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "背景色签" }).getByRole("button"),
  ).toHaveCount(28);
  await page.getByRole("button", { name: "选用胭脂", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "色调", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("combobox", { name: "色调", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "选用胭脂", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("dialog")).toHaveCSS(
    "background-color",
    "rgb(157, 41, 51)",
  );
  await expect(page.getByRole("dialog")).toHaveCSS(
    "color",
    "rgb(255, 255, 255)",
  );
  await page.screenshot({
    path: "test-results/traditional-colors-desktop.png",
  });
  await close(page);
  await expect(page.locator("#app")).toHaveCSS(
    "background-color",
    "rgb(157, 41, 51)",
  );
  await expect(page.getByLabel("当前背景色")).toContainText("胭脂#9D2933");
  const downloaded = page.waitForEvent("download");
  await tool(page, "导出诗词卡片");
  const file = await downloaded;
  const base64 = require("node:fs")
    .readFileSync(await file.path())
    .toString("base64");
  const pixel = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    return [...context.getImageData(0, 0, 1, 1).data];
  }, base64);
  expect(pixel).toEqual([157, 41, 51, 255]);
  await page.reload();
  await expect(page.locator("#app")).toHaveCSS(
    "background-color",
    "rgb(157, 41, 51)",
  );
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await expect(page.locator("#app")).not.toHaveCSS(
    "background-color",
    "rgb(157, 41, 51)",
  );
  await expect(page.locator("#app")).toHaveCSS("color", "rgb(255, 255, 255)");
  await page.setViewportSize({ width: 375, height: 667 });
  await settings(page);
  await groups.getByRole("button", { name: "绿", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "背景色签" }).getByRole("button"),
  ).toHaveCount(32);
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/traditional-colors-mobile-dark.png",
  });
  await page.getByRole("button", { name: "选用豆绿", exact: true }).click();
  await close(page);
  await page.screenshot({ path: "test-results/traditional-color-poem.png" });
});

test("点击出处和作者直接搜索，保留完整原始语句库", async ({
  page,
  context,
}) => {
  const entry = SENTENCES.find((entry) => entry.from_who);
  await page.evaluate(
    (id) => localStorage.setItem("favorites", JSON.stringify([id])),
    entry.uuid,
  );
  await page.reload();
  await tool(page, "收藏与历史");
  await page.locator(".library-list button").click();
  await context.route("https://**/*", (route) =>
    route.fulfill({ body: "搜索结果" }),
  );
  for (const [label, query] of [
    ["搜索诗词出处", `${entry.from} ${entry.from_who}`],
    ["搜索作者", entry.from_who],
  ]) {
    const link = page.getByRole("link", { name: label });
    await expect(link).toHaveAttribute("target", "_blank");
    const opened = page.waitForEvent("popup");
    await link.click();
    const popup = await opened;
    await expect(popup).toHaveURL(/^https:\/\/www.baidu.com\/s\?/);
    expect(new URL(popup.url()).searchParams.get("wd")).toBe(query);
    await popup.close();
  }
  await expect(page.getByText("白话释义", { exact: true })).toHaveCount(0);
});

test("竖排、背景纹理与设置持久化", async ({ page }) => {
  await settings(page);
  await page.getByLabel("竖排排版").check();
  await selectBackground(page, "yanzhi");
  await page.getByLabel("宣纸纹理").check();
  await close(page);
  await expect(page.locator(".poem-title")).toHaveCSS(
    "writing-mode",
    "vertical-rl",
  );
  await expect(page.locator("#app")).toHaveClass(/paper-texture/);
  await expect(page.locator("#app")).toHaveCSS(
    "background-color",
    "rgb(237, 201, 203)",
  );
  await page.reload();
  await expect(page.locator(".poem-title")).toHaveCSS(
    "writing-mode",
    "vertical-rl",
  );
  await settings(page);
  await expect(page.getByLabel("宣纸纹理")).toBeChecked();
});

test("换句、字体主题快捷键、空白双击；收藏历史恢复", async ({ page }) => {
  const original = await page.locator(".poem-title").innerText();
  await page.keyboard.press("Space");
  await expect(page.locator(".poem-title")).not.toHaveText(original);
  const next = await page.locator(".poem-title").innerText();
  await page.keyboard.press("f");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("fontIndex")))
    .toBe("1");
  await page.keyboard.press("t");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("theme")))
    .toBe("light");
  await tool(page, "收藏");
  await page.locator(".poem-stage").dblclick({ position: { x: 5, y: 5 } });
  await expect(page.locator(".poem-title")).not.toHaveText(next);
  await page.reload();
  await tool(page, "收藏与历史");
  await page.locator(".library-list button").first().click();
  await expect(page.locator(".poem-title")).toHaveText(next);
  await tool(page, "收藏与历史");
  await page.getByRole("button", { name: "历史", exact: true }).click();
  expect(await page.locator(".library-list li").count()).toBeGreaterThanOrEqual(
    2,
  );
});

test("搜索键入呼出，输入区不触发快捷键，两种搜索引擎编码查询", async ({
  page,
}) => {
  for (const engine of ["百度", "Google"]) {
    await settings(page);
    await page.getByLabel("默认搜索引擎").selectOption(engine);
    await close(page);
    await page.locator(".poem-stage").click({ position: { x: 5, y: 5 } });
    const poem = await page.locator(".poem-title").innerText();
    await page.keyboard.press("/");
    const input = page.getByRole("searchbox");
    await expect(input).toBeFocused();
    await input.fill("诗 & 月 # f t s c");
    await expect(page.locator(".poem-title")).toHaveText(poem);
    const navigation = page.waitForRequest(
      (request) =>
        request.isNavigationRequest() && !request.url().includes("localhost"),
    );
    await page.route("https://**/*", (route) => route.abort());
    await input.press("Enter");
    const request = await navigation;
    const url = new URL(request.url());
    expect(url.hostname).toBe(
      {
        Google: "www.google.com",
        百度: "www.baidu.com",
      }[engine],
    );
    expect(url.searchParams.get(engine === "百度" ? "wd" : "q")).toBe(
      "诗 & 月 # f t s c",
    );
    await page.goto("/newtab.html");
  }
  await expect(page.locator(".poem-title")).toBeVisible();
  await page.keyboard.press("x");
  await expect(page.getByRole("searchbox")).toHaveValue("x");
});

test("高分辨率横竖卡片真实下载 PNG", async ({ page }) => {
  for (const vertical of [false, true]) {
    if (vertical) {
      await settings(page);
      await page.getByLabel("竖排排版").check();
      await close(page);
    }
    const download = page.waitForEvent("download");
    await tool(page, "导出诗词卡片");
    const file = await download;
    const fs = require("node:fs");
    const data = fs.readFileSync(await file.path());
    expect(data.subarray(1, 4).toString()).toBe("PNG");
    expect(data.readUInt32BE(16)).toBe(2160);
    expect(data.readUInt32BE(20)).toBe(2880);
    expect(data.length).toBeGreaterThan(10000);
  }
});

test("损坏存储与小屏、深色模式不破坏页面", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("preferences", "{broken");
    localStorage.setItem("favorites", "null");
    localStorage.setItem("history", "{}");
    localStorage.setItem("fontIndex", "99999");
    localStorage.setItem("isMuted", "bad");
  });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await expect(page.locator(".poem-title")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await settings(page);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: "test-results/mobile-dark.png" });
});

test("复制快捷键、朗读降级提示和输入法呼出", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.keyboard.press("c");
  await expect(page.getByRole("status")).toHaveText("已复制诗句及出处");
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain("——");
  const author = page.getByRole("link", { name: "搜索作者" });
  if (await author.count())
    expect(clipboard).toContain(await author.innerText());
  await context.setOffline(true);
  await page.keyboard.press("s");
  await expect(page.getByRole("status")).toContainText(/正在朗读|中文语音/);
  await page.evaluate(() =>
    document.body.dispatchEvent(
      new CompositionEvent("compositionend", { data: "月", bubbles: true }),
    ),
  );
  await expect(page.getByRole("searchbox")).toHaveValue("月");
});

test("竖排小屏与桌面渲染不溢出", async ({ page }) => {
  await settings(page);
  await page.getByLabel("竖排排版").check();
  await close(page);
  await expect(page.locator(".poem-title")).toHaveCSS(
    "writing-mode",
    "vertical-rl",
  );
  await page.screenshot({ path: "test-results/desktop-vertical.png" });
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator(".poem-title")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile-vertical.png" });
});

test("初始默认百度与宣纸纹理，已移除繁体显示入口", async ({ page }) => {
  await expect(page.locator("#app")).toHaveClass(/paper-texture/);
  await settings(page);
  await expect(page.getByLabel("默认搜索引擎")).toHaveValue("百度");
  await expect(page.getByLabel("默认搜索引擎").locator("option")).toHaveText([
    "百度",
    "Google",
  ]);
  await expect(page.getByLabel("宣纸纹理")).toBeChecked();
  await expect(page.getByText("繁体显示", { exact: true })).toHaveCount(0);
  await page.getByLabel("宣纸纹理").uncheck();
  await close(page);
  await expect(page.locator("#app")).not.toHaveClass(/paper-texture/);
  await page.reload();
  await expect(page.locator("#app")).not.toHaveClass(/paper-texture/);
});

test("工具栏仅点击切换，悬停和聚焦不会展开，移开不会隐藏", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "诗词工具", exact: true });
  await expect(page.locator(".poem-toolbar button:visible")).toHaveCount(1);
  await expect(trigger.locator(".toolbar-label")).toHaveCount(0);
  await expect(trigger).not.toHaveAttribute("title");
  await trigger.hover();
  await trigger.focus();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.locator(".poem-stage").hover({ position: { x: 5, y: 5 } });
  await page.locator(".poem-stage").click({ position: { x: 5, y: 5 } });
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(page.locator("#theme-toggle")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("横排菜单标题在下，竖排菜单标题在右，小屏可滚动", async ({ page }) => {
  for (const vertical of [false, true]) {
    await page.evaluate(
      (vertical) =>
        localStorage.setItem("preferences", JSON.stringify({ vertical })),
      vertical,
    );
    await page.reload();
    await page.getByRole("button", { name: "诗词工具", exact: true }).click();
    await expect(page.locator(".toolbar-actions")).toHaveCSS(
      "flex-direction",
      vertical ? "column" : "row",
    );
    await expect(page.locator("#theme-toggle .toolbar-label")).toHaveCSS(
      "font-size",
      "11.2px",
    );
    const first = page.locator("#theme-toggle");
    const icon = await first.locator("svg").boundingBox();
    const label = await first.locator(".toolbar-label").boundingBox();
    const drawerIcon = await page
      .locator(".poem-toolbar > button svg")
      .boundingBox();
    expect(icon.width).toBe(18);
    expect(icon.height).toBe(18);
    expect(
      Math.abs(icon.x + icon.width / 2 - drawerIcon.x - drawerIcon.width / 2),
    ).toBeLessThan(0.5);
    if (vertical) expect(label.x).toBeGreaterThanOrEqual(icon.x + icon.width);
    else expect(label.y).toBeGreaterThanOrEqual(icon.y + icon.height);
    await page.screenshot({
      path: `test-results/menu-${vertical ? "vertical" : "horizontal"}.png`,
    });
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("#theme-toggle .toolbar-label")).toHaveCSS(
      "font-size",
      "11.2px",
    );
    const mobileIcon = await first.locator("svg").boundingBox();
    const mobileDrawerIcon = await page
      .locator(".poem-toolbar > button svg")
      .boundingBox();
    expect(
      Math.abs(
        mobileIcon.x +
          mobileIcon.width / 2 -
          mobileDrawerIcon.x -
          mobileDrawerIcon.width / 2,
      ),
    ).toBeLessThan(0.5);
    const menu = page.locator(".toolbar-actions");
    const box = await menu.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    expect(box.y).toBeGreaterThanOrEqual(0);
    await tool(page, "设置");
    await expect(page.getByRole("dialog", { name: "设置" })).toBeVisible();
    await close(page);
    await page.setViewportSize({ width: 1280, height: 720 });
  }
});

test("长出处和长作者的竖排布局，小屏仍完整显示", async ({ page }) => {
  const entries = SENTENCES.filter((entry) => entry.from_who)
    .sort((a, b) => b.from_who.length - a.from_who.length)
    .slice(0, 2);
  await page.evaluate(
    (ids) => {
      localStorage.setItem("preferences", JSON.stringify({ vertical: true }));
      localStorage.setItem("favorites", JSON.stringify(ids));
    },
    entries.map((entry) => entry.uuid),
  );
  await page.reload();
  await page.setViewportSize({ width: 375, height: 667 });
  for (const index of [0, 1]) {
    await tool(page, "收藏与历史");
    await page.locator(".library-list button").nth(index).click();
    await expect(page.locator(".source-title")).toHaveCSS(
      "writing-mode",
      "vertical-rl",
    );
    await expect(page.locator(".author-seal")).toHaveCSS(
      "writing-mode",
      "vertical-rl",
    );
    for (const selector of [".poem-title", ".source-title", ".author-seal"]) {
      const box = await page.locator(selector).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(375);
      expect(box.y + box.height).toBeLessThan(600);
    }
    await page.locator(".poem-stage").click({ position: { x: 5, y: 5 } });
    await page
      .locator(".poem")
      .evaluate((element) =>
        element.getAnimations().forEach((animation) => animation.finish()),
      );
    await page.screenshot({ path: `test-results/vertical-long-${index}.png` });
  }
});

test("点击复制后的提示不与横竖排菜单重叠", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const vertical of [false, true]) {
    await page.evaluate(
      (vertical) =>
        localStorage.setItem("preferences", JSON.stringify({ vertical })),
      vertical,
    );
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 375, height: 667 },
    ]) {
      await page.setViewportSize(viewport);
      await page.reload();
      await tool(page, "复制诗句（C）");
      const notice = page.getByRole("status");
      await expect(notice).toHaveText("已复制诗句及出处");
      await expect(
        page.getByRole("button", { name: "诗词工具", exact: true }),
      ).toHaveAttribute("aria-expanded", "true");
      const message = await notice.boundingBox();
      const menu = await page.locator(".toolbar-actions").boundingBox();
      const overlaps =
        message.x < menu.x + menu.width &&
        message.x + message.width > menu.x &&
        message.y < menu.y + menu.height &&
        message.y + message.height > menu.y;
      expect(overlaps).toBe(false);
    }
  }
});
