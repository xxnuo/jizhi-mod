import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    // plugins: [
    // ],
  }),
  manifest: {
    author: "xxnuo",
    name: "浮生梦",
    description: "支持自定义新标签页的 Chrome 扩展，在新标签页上展示中国经典诗词。",
  },
});
