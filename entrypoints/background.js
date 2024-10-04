import { browser } from "wxt/browser";
import { getVoice } from "../components/tts";

export default defineBackground(() => {
  // browser.runtime.onInstalled.addListener(() => {
  //   console.log("Extension installed");
  // });

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getVoice" && request.text) {
      getVoice(request.text)
        .then((response) => {
          if (response.ok) {
            return response.blob();
          } else {
            throw new Error(response.statusText);
          }
        })
        .then((blob) => {
          // console.log("Got voice", blob.size);
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result;
            sendResponse({ url: dataUrl });
          };
          reader.onerror = () => {
            console.error("Failed to read blob as data URL");
            sendResponse({ error: "Failed to read blob as data URL" });
            reader = null; // 清理 reader 对象
          };
          reader.readAsDataURL(blob);
        })
        .catch((error) => {
          console.error("Error fetching voice:", error);
          sendResponse({ error: error.message });
        });

      return true; // Keep the message channel open for asynchronous response
    }
  });
});
