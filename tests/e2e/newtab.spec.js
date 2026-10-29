const SENTENCES = require("sentences-bundle/sentences/i.json");
const { tool } = require("./helpers");
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
  await page.getByLabel("背景", { exact: true }).selectOption("yanzhi");
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
    const first = page.locator("#theme-toggle");
    const icon = await first.locator("svg").boundingBox();
    const label = await first.locator(".toolbar-label").boundingBox();
    if (vertical) expect(label.x).toBeGreaterThanOrEqual(icon.x + icon.width);
    else expect(label.y).toBeGreaterThanOrEqual(icon.y + icon.height);
    await page.screenshot({
      path: `test-results/menu-${vertical ? "vertical" : "horizontal"}.png`,
    });
    await page.setViewportSize({ width: 375, height: 667 });
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
