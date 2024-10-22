import { browser } from "wxt/browser";

const API_GetVoice_URL = "https://api.2020818.xyz/tts/gen";
const API_KEY = "Bearer e7dWR";

async function getVoice(text) {
  try {
    const response = await fetch(API_GetVoice_URL, {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBuffer)));
    return `data:audio/mpeg;base64,${base64}`;
  } catch (error) {
    console.error("获取语音时出错:", error);
    throw error;
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getVoice" && request.text) {
      getVoice(request.text)
        .then((dataUrl) => {
          sendResponse({ url: dataUrl });
        })
        .catch((error) => {
          sendResponse({ error: error.message });
        });

      return true; // 保持消息通道开放以进行异步响应
    }
  });
});
