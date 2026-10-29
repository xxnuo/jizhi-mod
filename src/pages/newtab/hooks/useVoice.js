import { useState, useCallback, useRef, useEffect } from "react";
import { browser } from "wxt/browser";
import { readStorage, writeStorage } from "../services/preferences";

export function useVoice(onError) {
  const [isMuted, setIsMuted] = useState(
    () => readStorage("isMuted", false) === true,
  );
  const [status, setStatus] = useState("idle");
  const state = useRef({
    audio: null,
    utterance: null,
    text: "",
    token: 0,
    mode: null,
  });
  const stopVoice = useCallback(() => {
    const current = state.current;
    current.token++;
    if (current.audio) {
      current.audio.pause();
      current.audio.onended = null;
      current.audio.onerror = null;
    }
    if (current.utterance) {
      current.utterance.onend = null;
      current.utterance.onerror = null;
      window.speechSynthesis?.cancel();
    }
    current.audio = null;
    current.utterance = null;
    current.text = "";
    current.mode = null;
    setStatus("idle");
  }, []);
  useEffect(() => {
    writeStorage("isMuted", isMuted);
    if (isMuted) stopVoice();
  }, [isMuted, stopVoice]);
  useEffect(() => stopVoice, [stopVoice]);

  const playVoice = useCallback(
    async (text) => {
      if (isMuted) return;
      const current = state.current;
      if (current.text === text && ["playing", "paused"].includes(status)) {
        const pause = status === "playing";
        const token = current.token;
        try {
          if (current.mode === "local")
            window.speechSynthesis[pause ? "pause" : "resume"]();
          else if (pause) current.audio.pause();
          else await current.audio.play();
          if (current.token === token) setStatus(pause ? "paused" : "playing");
        } catch {
          stopVoice();
          onError("朗读无法继续，请重试");
        }
        return;
      }
      if (status === "loading" && current.text === text) {
        stopVoice();
        return;
      }
      stopVoice();
      const token = current.token;
      current.text = text;
      setStatus("loading");
      const local = async () => {
        if (current.token !== token || current.mode === "local") return;
        current.mode = "local";
        current.audio?.pause();
        if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
          stopVoice();
          onError("此浏览器没有可用的本地朗读，请安装中文语音或联网后重试");
          return;
        }
        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        let voices = window.speechSynthesis.getVoices();
        if (!voices.length) {
          await new Promise((resolve) => {
            const ready = () => {
              clearTimeout(timer);
              window.speechSynthesis.removeEventListener?.(
                "voiceschanged",
                ready,
              );
              resolve();
            };
            const timer = setTimeout(ready, 1000);
            window.speechSynthesis.addEventListener?.("voiceschanged", ready);
          });
          if (current.token !== token) return;
          voices = window.speechSynthesis.getVoices();
        }
        const voice = voices.find(
          (voice) => voice.localService && /^zh/i.test(voice.lang),
        );
        if (navigator.onLine === false && !voice) {
          stopVoice();
          onError("未找到离线中文语音，请在系统中安装中文语音包");
          return;
        }
        if (voice) utterance.voice = voice;
        utterance.onend = () => {
          if (current.token === token) stopVoice();
        };
        utterance.onerror = () => {
          if (current.token === token) {
            stopVoice();
            onError("本地朗读失败，请检查系统中文语音包");
          }
        };
        current.utterance = utterance;
        current.mode = "local";
        setStatus("playing");
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          stopVoice();
          onError("本地朗读失败，请检查系统中文语音包");
        }
      };
      if (navigator.onLine === false) {
        await local();
        return;
      }
      let timer;
      try {
        const response = await Promise.race([
          browser.runtime.sendMessage({ action: "getVoice", text }),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error("语音请求超时")), 6000);
          }),
        ]);
        if (current.token !== token) return;
        if (!response?.url?.startsWith("data:audio/"))
          throw new Error("语音服务不可用");
        const audio = new Audio(response.url);
        current.audio = audio;
        current.mode = "remote";
        audio.onended = () => {
          if (current.token === token && current.mode === "remote") stopVoice();
        };
        audio.onerror = local;
        await audio.play();
        if (current.token === token && current.mode === "remote")
          setStatus("playing");
      } catch {
        await local();
      } finally {
        clearTimeout(timer);
      }
    },
    [isMuted, status, stopVoice, onError],
  );
  const toggleMute = useCallback(() => setIsMuted((previous) => !previous), []);
  return { isMuted, toggleMute, playVoice, stopVoice, status };
}
