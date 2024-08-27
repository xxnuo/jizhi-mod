import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () => ({}),
  manifest: {
    author: "unicar9,xxnuo",
    name: "几枝夏",
    description: "支持自定义新标签页的 Chrome 扩展，几枝夏将在新标签页上展示中国经典诗词。",
    // permissions: ["tabs"],
    // browser_specific_settings: {
    //   gecko: {
    //     id: "jizhi-mod@unicar9-xxnuo.github",
    //   },
    // },
    // 不需要
    // host_permissions: [
    //   "https://dev.microsofttranslator.com/*",
    //   "https://*.tts.speech.microsoft.com/*",
    //   "https://*.api.speech.microsoft.com/*",
    // ],
  },
});
