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

test("离线全文、释义、作者背景；模态框关闭恢复焦点", async ({
  page,
  context,
}) => {
  await context.setOffline(true);
  await page.getByRole("button", { name: "查看全文与释义" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "白话释义" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "作者背景" })).toBeVisible();
  expect(
    (await dialog.locator(".full-poem").innerText()).length,
  ).toBeGreaterThan(15);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "查看全文与释义" }),
  ).toBeFocused();
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

test("偏好过滤不允许空选，筛选后换句始终属于该类", async ({ page }) => {
  await settings(page);
  for (const category of ["宋词", "诗经", "先秦散文", "现代文学"])
    await page.getByLabel(category, { exact: true }).uncheck();
  await expect(page.getByLabel("唐诗", { exact: true })).toBeDisabled();
  await close(page);
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "查看作者背景" })).toHaveText(
      /李白|孟浩然|王维|王之涣/,
    );
  }
});

test("搜索键入呼出，输入区不触发快捷键，四种搜索引擎编码查询", async ({
  page,
}) => {
  for (const engine of ["Google", "百度", "Bing", "DuckDuckGo"]) {
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
        Bing: "www.bing.com",
        DuckDuckGo: "duckduckgo.com",
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
  expect(clipboard).toContain(
    await page.getByRole("button", { name: "查看作者背景" }).innerText(),
  );
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

test("初始默认 Bing 与宣纸纹理，已移除繁体显示入口", async ({ page }) => {
  await expect(page.locator("#app")).toHaveClass(/paper-texture/);
  await settings(page);
  await expect(page.getByLabel("默认搜索引擎")).toHaveValue("Bing");
  await expect(page.getByLabel("宣纸纹理")).toBeChecked();
  await expect(page.getByText("繁体显示", { exact: true })).toHaveCount(0);
  await page.getByLabel("宣纸纹理").uncheck();
  await close(page);
  await expect(page.locator("#app")).not.toHaveClass(/paper-texture/);
  await page.reload();
  await expect(page.locator("#app")).not.toHaveClass(/paper-texture/);
});

test("工具栏默认收起，悬停、点击、键盘都能展开及收起", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "诗词工具", exact: true });
  await expect(page.locator(".poem-toolbar button:visible")).toHaveCount(1);
  await trigger.hover();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("button", { name: "设置", exact: true }),
  ).toBeVisible();
  await page.locator(".poem-stage").hover({ position: { x: 5, y: 5 } });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Tab");
  await trigger.focus();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(page.locator("#theme-toggle")).toBeFocused();
});

test("长出处和长作者的竖排布局，小屏仍完整显示", async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem("preferences", JSON.stringify({ vertical: true }));
    localStorage.setItem("favorites", JSON.stringify(["tianchou", "mengzi"]));
  });
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
