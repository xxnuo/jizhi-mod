import { useState, useCallback, useRef, useEffect } from "react";
import { browser } from "wxt/browser";

export function useVoice() {
  const [voiceData, setVoiceData] = useState(null);
  const [isMuted, setIsMuted] = useState(() => JSON.parse(localStorage.getItem("isMuted") || "false"));
  const audioRef = useRef(new Audio());

  useEffect(() => {
    audioRef.current.muted = isMuted;
    localStorage.setItem("isMuted", JSON.stringify(isMuted));
  }, [isMuted]);

  const playVoice = useCallback(async (text) => {
    if (isMuted) return;

    try {
      if (!voiceData) {
        const response = await browser.runtime.sendMessage({ action: "getVoice", text });
        if (!response.url) throw new Error(response.error || "获取语音数据失败");

        setVoiceData(response.url);
        audioRef.current.src = response.url;
      } else {
        audioRef.current.currentTime = 0;
      }

      await audioRef.current.play();
    } catch (error) {
      console.error("播放音频时出错:", error.message);
    }
  }, [isMuted, voiceData]);

  const toggleMute = useCallback(() => setIsMuted((prevMuted) => !prevMuted), []);

  return { isMuted, toggleMute, playVoice };
} 