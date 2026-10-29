import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ browser }) => ({
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: { id: "{5c52f9a1-a16f-4f31-8990-ebf555df5d9c}" },
          },
        }
      : {}),
    author: "xxnuo",
    name: "浮生梦",
    description:
      "支持自定义新标签页的 Chrome 扩展，在新标签页上展示中国经典诗词。",
    action: {
      default_icon: {
        16: "icon/16.png",
        24: "icon/24.png",
        32: "icon/32.png",
        48: "icon/48.png",
        64: "icon/64.png",
        128: "icon/128.png",
      },
      default_title: "浮生梦",
    },
  }),
});
