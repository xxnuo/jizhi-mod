const { tool, selectDecoration } = require("./helpers");
const { test, expect, chromium } = require("@playwright/test");
const path = require("node:path");

test("真实扩展断网后加载全部国画、边饰与字体，保存配景并导出", async () => {
  const extension = path.resolve(".output/chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
  });
  try {
    const worker =
      context.serviceWorkers()[0] ||
      (await context.waitForEvent("serviceworker"));
    const id = new URL(worker.url()).host;
    await context.setOffline(true);
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    await page.goto(`chrome-extension://${id}/newtab.html`);
    await expect(page.locator(".poem-title")).toBeVisible();
    const files = require("node:fs").readdirSync(
      path.join(extension, "illustrations"),
    );
    const failed = await page.evaluate(async (files) => {
      const results = await Promise.all(
        files.map(async (file) => {
          const image = new Image();
          image.src = `/illustrations/${file}`;
          try {
            await image.decode();
            return null;
          } catch {
            return file;
          }
        }),
      );
      return results.filter(Boolean);
    }, files);
    expect(failed).toEqual([]);
    await tool(page, "设置");
    await selectDecoration(page, "国画配图", "lake");
    await selectDecoration(page, "画面边饰", "lotus");
    await page.keyboard.press("Escape");
    await page.reload();
    await expect(page.locator(".background-artwork")).toHaveAttribute(
      "src",
      "/illustrations/background-hengshan.webp",
    );
    await expect(page.locator(".background-frame")).toBeAttached();
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({
      path: "test-results/artwork-extension-dark-offline.png",
    });
    for (let index = 0; index < 7; index++) {
      const downloaded = page.waitForEvent("download");
      await tool(page, "导出诗词卡片");
      const file = await downloaded;
      expect(await file.failure()).toBeNull();
      if (index === 0)
        await file.saveAs("test-results/card-extension-offline.png");
      await tool(page, "切换字体（F）");
    }
  } finally {
    await context.close();
  }
});

test("真实 MV3 扩展：后台消息、离线词库、收藏、七种字体与导出", async () => {
  const extension = path.resolve(".output/chrome-mv3");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
  });
  try {
    const worker =
      context.serviceWorkers()[0] ||
      (await context.waitForEvent("serviceworker"));
    const id = new URL(worker.url()).host;
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`chrome-extension://${id}/newtab.html`);
    await expect(page.locator(".poem-title")).toBeVisible();
    const response = await page.evaluate(() =>
      chrome.runtime.sendMessage({
        action: "getVoice",
        text: "举头望明月，低头思故乡。",
      }),
    );
    expect(response.url, response.error).toMatch(/^data:audio\/mpeg;base64,/);
    const duration = await page.evaluate(
      (url) =>
        new Promise((resolve, reject) => {
          const audio = new Audio(url);
          const timer = setTimeout(
            () => reject(new Error("音频解码超时")),
            3000,
          );
          audio.onloadedmetadata = () => {
            clearTimeout(timer);
            resolve(audio.duration);
          };
          audio.onerror = () => {
            clearTimeout(timer);
            reject(new Error("音频解码失败"));
          };
        }),
      response.url,
    );
    expect(duration).toBeGreaterThan(0);
    await context.setOffline(true);
    await expect(
      page.getByRole("link", { name: "搜索诗词出处" }),
    ).toHaveAttribute("href", /^https:\/\/www.baidu.com\/s/);
    await tool(page, "收藏");
    await page.reload();
    await tool(page, "收藏与历史");
    await expect(page.locator(".library-list li")).toHaveCount(1);
    await page.keyboard.press("Escape");
    const fonts = new Set();
    for (let index = 0; index < 7; index++) {
      fonts.add(
        await page
          .locator("#app")
          .evaluate((element) =>
            element.style.getPropertyValue("--custom-font-name"),
          ),
      );
      const download = page.waitForEvent("download");
      await tool(page, "导出诗词卡片");
      const file = await download;
      expect(await file.failure()).toBeNull();
      if (index === 0) await file.saveAs("test-results/export-horizontal.png");
      await tool(page, "切换字体（F）");
    }
    expect(fonts.size).toBe(7);
    await tool(page, "设置");
    await page.getByLabel("竖排排版").check();
    await page.keyboard.press("Escape");
    await page.screenshot({ path: "test-results/extension-offline.png" });
    const download = page.waitForEvent("download");
    await tool(page, "导出诗词卡片");
    await (await download).saveAs("test-results/export-vertical.png");
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
