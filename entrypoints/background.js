import { browser } from "wxt/browser";

function getVoice(text) {
  // return fetch(`http://localhost:8787/tts/gen`, {
  return fetch(`https://api.2020818.xyz/tts/gen`, {
    method: "POST",
    headers: {
      Authorization: "Bearer e7dWR",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
}

export default defineBackground(() => {
  // browser.runtime.onInstalled.addListener(() => {
  //   console.log("Extension installed");
  // });

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getVoice" && request.text) {
      getVoice(request.text)
        .then((response) => {
          if (response.ok) {
            return response.arrayBuffer(); // 使用 arrayBuffer 而不是 blob
          } else {
            throw new Error(response.statusText);
          }
        })
        .then((arrayBuffer) => {
          const base64 = btoa(
            new Uint8Array(arrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          const dataUrl = `data:audio/mpeg;base64,${base64}`;
          sendResponse({ url: dataUrl });
        })
        .catch((error) => {
          console.error("Error fetching voice:", error);
          sendResponse({ error: error.message });
        });

      return true; // 保持消息通道开放以进行异步响应
    }
  });
});
