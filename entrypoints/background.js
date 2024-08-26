import { browser } from "wxt/browser";
import { getVoice } from "../components/tts";

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");
  });

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getVoice") {
      getVoice(request.text)
        .then((response) => {
          if (response.ok) {
            return response.blob();
          } else {
            throw new Error(response.statusText);
          }
        })
        .then((blob) => {
          // console.log("Got voice:", blob);
          console.log("Got voice");
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result;
            sendResponse({ url: dataUrl });
          };
          reader.onerror = () => {
            throw new Error("Failed to read blob as data URL");
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
