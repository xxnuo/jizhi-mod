async function tool(page, name) {
  await page.getByRole("button", { name: "诗词工具", exact: true }).hover();
  await page.getByRole("button", { name, exact: true }).click();
}
module.exports = { tool };
