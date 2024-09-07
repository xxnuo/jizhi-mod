import { DARK_THEME, FONTNAME_LIST, LIGHT_THEME, POEM_MAXLINELENGTH } from "./components/Constants";
import { getRandomPoem } from "./components/Poem";
// import type { Poem } from "./components/Poem";

import { useEffect, useState } from "react";
import { IoMoonOutline as MoonIcon, IoSunnyOutline as SunIcon } from "react-icons/io5";
import { BiFontFamily as FontIcon } from "react-icons/bi";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import "animate.css";
import "./style.css";
import { browser } from "wxt/browser";

export default function App() {
  const storedFontIndex = localStorage.getItem("fontIndex");
  const initialFontIndex = storedFontIndex ? parseInt(storedFontIndex, 10) : 0;
  const [fontIndex, setFontIndex] = useState(initialFontIndex);

  useEffect(() => {
    localStorage.setItem("fontIndex", JSON.stringify(fontIndex));
  }, [fontIndex]);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const storedDarkMode = localStorage.getItem("isDarkMode");
    if (storedDarkMode) {
      setIsDarkMode(JSON.parse(storedDarkMode));
    } else {
      setIsDarkMode(mediaQuery.matches);
    }

    // const handleChange = (event: MediaQueryListEvent) => {
    const handleChange = (event) => {
      setIsDarkMode(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? DARK_THEME : LIGHT_THEME);
  }, [isDarkMode]);

  const [poem, setPoem] = useState(getRandomPoem());

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
          description: "页面默认跟随系统主题，点击按钮临时切换主题。",
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

  return (
    <div
      id="app"
      className="custom-font animate__animated animate__fadeIn animate__faster"
      style={{
        "--custom-font-name": FONTNAME_LIST[fontIndex],
      }}
    >
      <div className="min-h-screen flex items-center justify-center">
        <div className="justify-center text-center">
          <div className="justify-center item-center flex flex-col">
            <p
              id="poem-title-container"
              className="text-5xl mb-10 whitespace-pre-wrap cursor-pointer"
              onClick={() => {
                if (!voiceData || voiceData === "") {
                  browser.runtime.sendMessage({ action: "getVoice", text: poem.title }).then((response) => {
                    if (response.url) {
                      // console.log("Audio URL:", response.url);
                      setVoiceData(response.url);
                      const audio = new Audio(response.url);
                      audio.play();
                    } else {
                      console.error("Error:", response.error);
                    }
                  });
                } else {
                  const audio = new Audio(voiceData);
                  audio.play();
                }
              }}
            >
              {poem.title}
            </p>
          </div>
          <div id="poem-author-container" className="flex justify-center">
            <p className="text-3xl mr-4">
              <a href={`https://www.baidu.com/s?wd=${poem.from} ${poem.who ? poem.who : ""}`} target="_blank">
                「{poem.from}」
              </a>
            </p>
            {poem.who && (
              <p className="flex align-items-center justify-center text-center text-2xl rounded-md pr-1 mr-1 custom-author-style">
                <a
                  className="pl-0.5 pr-1"
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
        <div className="tooltip" data-tip="切换主题">
          <div className="custom-settings-button-style">
            <label id="theme-toggle" tabIndex={0} className="swap swap-rotate">
              <input
                type="checkbox"
                className="theme-controller"
                checked={isDarkMode}
                onChange={() => {
                  setIsDarkMode(!isDarkMode);
                  localStorage.setItem("isDarkMode", !isDarkMode);
                }}
              />
              <SunIcon className="swap-on fill-current w-7 h-7" />
              <MoonIcon className="swap-off fill-current w-7 h-7" />
            </label>
          </div>
        </div>
        <div className="ml-4"></div>
        {/* 字体切换按钮 */}
        <div className="tooltip" data-tip="切换字体">
          <div id="font-toggle" className="custom-settings-button-style">
            <label id="theme-toggle" className="swap">
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
      </div>
    </div>
  );
}
