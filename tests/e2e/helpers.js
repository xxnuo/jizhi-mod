async function tool(page, name) {
  const trigger = page.getByRole("button", { name: "诗词工具", exact: true });
  if ((await trigger.getAttribute("aria-expanded")) === "false")
    await trigger.click();
  await page.getByRole("button", { name, exact: true }).click();
}
async function selectBackground(page, id) {
  const picker = page.getByRole("group", { name: "色调", exact: true });
  if (["theme", "daily"].includes(id)) {
    await picker
      .getByRole("group", { name: "色系", exact: true })
      .getByRole("button", { name: "常用", exact: true })
      .click();
    await picker
      .getByRole("button", {
        name: id === "theme" ? "跟随主题" : "每日传统色",
        exact: true,
      })
      .click();
    return;
  }
  const groups = require("../../src/pages/newtab/services/colors.json");
  const group = groups.find((group) =>
    group.colors.some((color) => color.id === id),
  );
  const name =
    group?.colors.find((color) => color.id === id)?.name ||
    { yuebai: "月白", tianqing: "天青", dailan: "黛蓝", yanzhi: "胭脂" }[id];
  await picker
    .getByRole("group", { name: "色系", exact: true })
    .getByRole("button", { name: group?.name || "常用", exact: true })
    .click();
  await picker
    .getByRole("button", { name: `选用${name}`, exact: true })
    .click();
}
async function selectDecoration(page, label, id) {
  await page
    .getByRole("group", { name: label, exact: true })
    .locator(`button[value="${id}"]`)
    .click();
}
async function exportCard(page, ratio) {
  await tool(page, "导出诗词卡片");
  const selected =
    ratio || ((await page.locator(".poem-vertical").count()) ? "3:4" : "4:3");
  await page
    .getByRole("dialog", { name: "选择卡片比例", exact: true })
    .locator(`button[value="${selected}"]`)
    .click();
}
module.exports = { tool, selectBackground, selectDecoration, exportCard };
