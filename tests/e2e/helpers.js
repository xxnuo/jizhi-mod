async function tool(page, name) {
  const trigger = page.getByRole("button", { name: "诗词工具", exact: true });
  if ((await trigger.getAttribute("aria-expanded")) === "false")
    await trigger.click();
  await page.getByRole("button", { name, exact: true }).click();
}
module.exports = { tool };
