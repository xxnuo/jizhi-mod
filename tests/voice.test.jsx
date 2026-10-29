import React from "react";
import { act, renderHook, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
const { sendMessage } = vi.hoisted(() => ({ sendMessage: vi.fn() }));
vi.mock("wxt/browser", () => ({ browser: { runtime: { sendMessage } } }));
import { useVoice } from "../src/pages/newtab/hooks/useVoice";
let audios, speech, notify;
beforeEach(() => {
  localStorage.clear();
  audios = [];
  notify = vi.fn();
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  speech = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: () => [{ lang: "zh-CN", localService: true }],
  };
  vi.stubGlobal("speechSynthesis", speech);
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      constructor(text) {
        this.text = text;
      }
    },
  );
  vi.stubGlobal(
    "Audio",
    class {
      constructor(src) {
        this.src = src;
        this.play = vi.fn().mockResolvedValue();
        this.pause = vi.fn();
        audios.push(this);
      }
    },
  );
  sendMessage.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
test("远程播放暂停恢复，换句丢弃旧请求，卸载停止", async () => {
  sendMessage.mockResolvedValue({ url: "data:audio/mpeg;base64,AA" });
  const { result, unmount } = renderHook(() => useVoice(notify));
  await act(() => result.current.playVoice("第一句"));
  expect(result.current.status).toBe("playing");
  await act(() => result.current.playVoice("第一句"));
  expect(result.current.status).toBe("paused");
  await act(() => result.current.playVoice("第一句"));
  expect(result.current.status).toBe("playing");
  let resolve;
  sendMessage.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  let pending;
  act(() => {
    pending = result.current.playVoice("第二句");
  });
  act(() => result.current.stopVoice());
  await act(async () => {
    resolve({ url: "data:audio/mpeg;base64,AA" });
    await pending;
  });
  expect(audios).toHaveLength(1);
  expect(result.current.status).toBe("idle");
  unmount();
  expect(audios[0].pause).toHaveBeenCalled();
});
test("远程失败自动降级，支持本地暂停恢复，静音取消", async () => {
  sendMessage.mockRejectedValue(new Error("network"));
  const { result } = renderHook(() => useVoice(notify));
  await act(() => result.current.playVoice("明月"));
  expect(speech.speak).toHaveBeenCalledWith(
    expect.objectContaining({ text: "明月", lang: "zh-CN" }),
  );
  await act(() => result.current.playVoice("明月"));
  expect(speech.pause).toHaveBeenCalled();
  await act(() => result.current.playVoice("明月"));
  expect(speech.resume).toHaveBeenCalled();
  act(() => result.current.toggleMute());
  expect(speech.cancel).toHaveBeenCalled();
  await act(() => result.current.playVoice("静音"));
  expect(speech.speak).toHaveBeenCalledTimes(1);
});
test("离线直接使用中文本地语音，无语音包时明确提示", async () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  const { result } = renderHook(() => useVoice(notify));
  await act(() => result.current.playVoice("离线"));
  expect(sendMessage).not.toHaveBeenCalled();
  expect(speech.speak).toHaveBeenCalledTimes(1);
  act(() => result.current.stopVoice());
  speech.getVoices = () => [];
  await act(() => result.current.playVoice("缺少语音"));
  expect(notify).toHaveBeenCalledWith(
    expect.stringContaining("安装中文语音包"),
  );
});
test("六秒超时降级，晚到响应不会覆盖本地播放", async () => {
  vi.useFakeTimers();
  let resolve;
  sendMessage.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const { result } = renderHook(() => useVoice(notify));
  let pending;
  act(() => {
    pending = result.current.playVoice("超时");
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(6000);
    await pending;
  });
  expect(speech.speak).toHaveBeenCalledTimes(1);
  await act(async () => resolve({ url: "data:audio/mpeg;base64,AA" }));
  expect(audios).toHaveLength(0);
});

test("音频解码失败仅降级一次，旧音频的结束不会中断本地朗读", async () => {
  sendMessage.mockResolvedValue({ url: "data:audio/mpeg;base64,AA" });
  const { result } = renderHook(() => useVoice(notify));
  await act(() => result.current.playVoice("解码失败"));
  await act(async () => {
    await audios[0].onerror();
    await audios[0].onerror();
  });
  expect(speech.speak).toHaveBeenCalledTimes(1);
  act(() => audios[0].onended());
  expect(result.current.status).toBe("playing");
});

test("语音列表异步加载后选择离线中文语音", async () => {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
  speech.getVoices = vi
    .fn()
    .mockReturnValueOnce([])
    .mockReturnValue([{ lang: "zh-CN", localService: true }]);
  let ready;
  speech.addEventListener = vi.fn((event, callback) => {
    ready = callback;
  });
  speech.removeEventListener = vi.fn();
  const { result } = renderHook(() => useVoice(notify));
  let pending;
  act(() => {
    pending = result.current.playVoice("异步语音");
  });
  await act(async () => {
    ready();
    await pending;
  });
  expect(speech.speak).toHaveBeenCalledTimes(1);
  expect(speech.removeEventListener).toHaveBeenCalled();
});
