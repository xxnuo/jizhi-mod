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
    // 使用更高效的方法将 ArrayBuffer 转换为 Base64
    const base64 = await arrayBufferToBase64(arrayBuffer);
    return `data:audio/mpeg;base64,${base64}`;
  } catch (error) {
    console.error("获取语音时出错:", error);
    throw error;
  }
}

// 新增函数：高效地将 ArrayBuffer 转换为 Base64
function arrayBufferToBase64(buffer) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: "application/octet-binary" });
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target.readyState === FileReader.DONE) {
        const dataUrl = evt.target.result;
        const base64 = dataUrl.substr(dataUrl.indexOf(",") + 1);
        resolve(base64);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
