const { test, expect, chromium } = require("@playwright/test");
const path = require("node:path");

test("真实 MV3 扩展：后台消息、离线全文、收藏、七种字体与导出", async () => {
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
    await page.getByRole("button", { name: "查看全文与释义" }).click();
    await expect(page.getByRole("heading", { name: "白话释义" })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "收藏", exact: true }).click();
    await page.reload();
    await page.getByRole("button", { name: "收藏与历史", exact: true }).click();
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
      await page.getByRole("button", { name: "导出诗词卡片" }).click();
      const file = await download;
      expect(await file.failure()).toBeNull();
      if (index === 0) await file.saveAs("test-results/export-horizontal.png");
      await page.getByRole("button", { name: "切换字体（F）" }).click();
    }
    expect(fonts.size).toBe(7);
    await page.getByRole("button", { name: "设置", exact: true }).click();
    await page.getByLabel("竖排排版").check();
    await page.getByLabel("繁体显示").check();
    await page.keyboard.press("Escape");
    await page.screenshot({ path: "test-results/extension-offline.png" });
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "导出诗词卡片" }).click();
    await (await download).saveAs("test-results/export-vertical.png");
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
