import { DARK_THEME, FONTNAME_LIST, LIGHT_THEME, POEM_MAXLINELENGTH } from "./components/Constants";
import { getRandomPoem } from "./components/Poem";
// import type { Poem } from "./components/Poem";

import { useEffect, useState, useRef, useCallback } from "react";
import { browser } from "wxt/browser";

import { IoMoonOutline as MoonIcon, IoSunnyOutline as SunIcon } from "react-icons/io5";
import { MdTimelapse as SyncIcon } from "react-icons/md";

import { BiFontFamily as FontIcon } from "react-icons/bi";
import { IoVolumeHighOutline as VolumeOnIcon, IoVolumeMuteOutline as VolumeOffIcon } from "react-icons/io5";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import "animate.css";
import "./style.css";

export default function App() {
  // 重构为主题
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  // 监听系统主题变化的回调
  const mediaHandleChange = (event) => {
    // console.log("mediaHandleChange", event.matches);
    const storedTheme = localStorage.getItem("theme") || "sync";
    if (storedTheme === "sync") {
      document.documentElement.setAttribute("data-theme", event.matches ? DARK_THEME : LIGHT_THEME);
    } else if (storedTheme === "light") {
      document.documentElement.setAttribute("data-theme", LIGHT_THEME);
    } else if (storedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", DARK_THEME);
    }
  };

  // 初始化主题设置
  useEffect(() => {
    mediaQuery.addEventListener("change", mediaHandleChange);
    return () => {
      mediaQuery.removeEventListener("change", mediaHandleChange);
    };
  }, []);

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "sync");
  // theme 值变化时，设置主题
  useEffect(() => {
    // console.log("theme", theme);
    localStorage.setItem("theme", theme);
    mediaHandleChange(mediaQuery);
  }, [theme]);

  const storedFontIndex = localStorage.getItem("fontIndex");
  const initialFontIndex = storedFontIndex ? parseInt(storedFontIndex, 10) : 0;
  const [fontIndex, setFontIndex] = useState(initialFontIndex);

  useEffect(() => {
    localStorage.setItem("fontIndex", JSON.stringify(fontIndex));
  }, [fontIndex]);

  const [poem, setPoem] = useState(getRandomPoem());
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    let newTitle = poem.title;
    if (!/^[A-Za-z]/.test(newTitle[0])) {
      newTitle = newTitle.replace(/[^\u4E00-\u9FA5\t\n\r]/g, " ");
      newTitle = newTitle.replace(/\s+/g, " ").trim();
      if (newTitle.length >= POEM_MAXLINELENGTH) {
        const lines = newTitle.split(/\s+/);
        const mod = lines.length % 2;
        const result = [];
        if (mod === 0) {
          for (let i = 0; i < lines.length; i += 2) {
            result.push(lines[i] + " " + lines[i + 1]);
          }
        } else {
          for (let i = 0; i < lines.length; i++) {
            result.push(lines[i]);
          }
        }
        newTitle = result.join("\n");
      }
    }

    setPoem({ ...poem, title: newTitle });
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000); // 动画持续时间
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hasZh = navigator.languages.includes("zh");
    document.title = hasZh ? "新标签页" : "New Tab";
  }, []);

  // 引导
  useEffect(() => {
    const firstRunSteps = [
      {
        element: "#theme-toggle",
        popover: {
          title: "使用引导：切换主题",
          description: "点击按钮切换主题，当前为跟随系统主题。",
          side: "top",
        },
      },
      {
        element: "#font-toggle",
        popover: {
          title: "使用引导：切换字体",
          description: "点击按钮切换你喜欢的字体，有七种风格迥异的字体可供选择。",
          side: "top",
        },
      },
    ];
    const update1VoiceSteps = [
      {
        element: "#poem-title-container",
        popover: {
          title: "新功能说明：诗朗诵",
          description: "点击诗句，稍等片刻即可聆听朗诵。（初次使用该功能时请耐心等待加载）。",
          side: "top",
          align: "center",
        },
      },
      {
        element: "#poem-author-container",
        popover: {
          title: "新功能说明：查询详细信息",
          description: "点击诗题，跳转搜索引擎查看这首诗词的详细信息。",
          side: "top",
          align: "center",
        },
      },
    ];

    const steps = [];

    const storedFirstRun = localStorage.getItem("firstRun");
    if (!storedFirstRun || storedFirstRun === "1") {
      steps.push(...firstRunSteps);
    }

    const update1voice = localStorage.getItem("update1voice");
    if (!update1voice || update1voice === "1") {
      steps.push(...update1VoiceSteps);
    }

    if (steps.length > 0) {
      const driverObj = driver({
        popoverOffset: 10,
        showProgress: true,
        progressText: "第{{current}}条，共{{total}}条",
        nextBtnText: "继续 →",
        prevBtnText: "← 上一条",
        doneBtnText: "完成引导",
        onDestroyStarted: () => {
          if (!driverObj.hasNextStep() || confirm("使用引导仅显示一次，是否直接结束引导？")) {
            driverObj.destroy();
            if (!storedFirstRun || storedFirstRun === "1") {
              localStorage.setItem("firstRun", "0");
            }
            if (!update1voice || update1voice === "1") {
              localStorage.setItem("update1voice", "0");
            }
          }
        },
        steps: steps,
      });

      driverObj.drive();
    }
  }, []);

  const [voiceData, setVoiceData] = useState(null);
  const audioRef = useRef(new Audio());

  const playVoice = async () => {
    // 如果静音，则不播放
    if (isMuted) {
      return;
    }
    if (!voiceData) {
      try {
        const response = await browser.runtime.sendMessage({ action: "getVoice", text: poem.title });
        if (response.url) {
          setVoiceData(response.url);
          audioRef.current.src = response.url;
          await audioRef.current.play();
        } else {
          console.error("错误:", response.error);
        }
      } catch (error) {
        console.error("播放音频时出错:", error);
      }
    } else {
      // 停止播放然后重新播放
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const storedMuted = localStorage.getItem("isMuted");
  const [isMuted, setIsMuted] = useState(storedMuted ? JSON.parse(storedMuted) : false);

  useEffect(() => {
    audioRef.current.muted = isMuted;
    localStorage.setItem("isMuted", JSON.stringify(isMuted));
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted((prevMuted) => !prevMuted);
  };

  return (
    <div
      id="app"
      className="custom-font"
      style={{
        "--custom-font-name": FONTNAME_LIST[fontIndex],
      }}
    >
      <div className="min-h-screen flex items-center justify-center">
        <div className={`justify-center text-center ${isAnimating ? 'animate__animated animate__fadeIn animate__faster' : ''}`}>
          <div className="justify-center item-center flex flex-col">
            <p
              id="poem-title-container"
              className="text-5xl mb-10 whitespace-pre-wrap cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={playVoice}
            >
              {poem.title}
            </p>
          </div>
          <div id="poem-author-container" className="flex justify-center">
            <p className="text-3xl mr-4 transition-all duration-300 hover:text-opacity-80">
              <a href={`https://www.baidu.com/s?wd=${poem.from} ${poem.who ? poem.who : ""}`} target="_blank">
                「{poem.from}」
              </a>
            </p>
            {poem.who && (
              <p className="flex align-items-center justify-center text-center text-2xl rounded-md px-2 py-0 custom-author-style transition-all duration-300 hover:opacity-80">
                <a
                  className="leading-normal"
                  href={`https://www.baidu.com/s?wd=${poem.who ? poem.who : ""}`}
                  target="_blank"
                >
                  {poem.who}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-6 z-50 flex">
        {/* 主题切换按钮 */}
        <div
          className="tooltip"
          data-tip={`${theme === "sync" ? "系统主题" : theme === "dark" ? "深色主题" : "浅色主题"}`}
        >
          <div
            id="theme-toggle"
            className="custom-settings-button-style transition-all duration-300 hover:scale-110"
            onClick={() => {
              const themes = ["light", "dark", "sync"];
              const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
              setTheme(nextTheme);
            }}
          >
            {theme === "light" && <SunIcon className="swap-on fill-current w-8 h-8" />}
            {theme === "dark" && <MoonIcon className="swap-on fill-current w-8 h-8" />}
            {theme === "sync" && <SyncIcon className="swap-on fill-current w-8 h-8" />}
          </div>
        </div>

        <div className="ml-4"></div>
        {/* 字体切换按钮 */}
        <div className="tooltip" data-tip="切换字体">
          <div id="font-toggle" className="custom-settings-button-style transition-all duration-300 hover:scale-110">
            <label className="swap">
              <input
                type="checkbox"
                onClick={() => {
                  setFontIndex((fontIndex + 1) % FONTNAME_LIST.length);
                }}
              />
              <FontIcon className="swap-on fill-current w-8 h-8" />
              <FontIcon className="swap-off fill-current w-8 h-8" />
            </label>
          </div>
        </div>
        <div className="ml-4"></div>
        {/* 静音按钮 */}
        <div className="tooltip" data-tip="静音">
          <div id="font-toggle" className="custom-settings-button-style transition-all duration-300 hover:scale-110">
            <label className="swap">
              <input type="checkbox" checked={isMuted} onChange={toggleMute} />
              <VolumeOffIcon className="swap-on fill-current w-8 h-8" />
              <VolumeOnIcon className="swap-off fill-current w-8 h-8" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
