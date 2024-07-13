import { DARK_THEME, FONTNAME_LIST, LIGHT_THEME, POEM_MAXLINELENGTH } from "./components/Constants";
import { getRandomPoem } from "./components/Poem";
// import type { Poem } from "./components/Poem";

import { useEffect, useState } from "react";
import { IoMoonOutline as MoonIcon, IoSunnyOutline as SunIcon } from "react-icons/io5";
import { BiFontFamily as FontIcon } from "react-icons/bi";

import { driver } from "driver.js";
import "./node_modules/driver.js/dist/driver.css";

import "animate.css";
import "./style.css";

export default function App() {
  const storedFontIndex = localStorage.getItem("fontIndex");
  const initialFontIndex = storedFontIndex ? parseInt(storedFontIndex, 10) : 0;
  const [fontIndex, setFontIndex] = useState(initialFontIndex);

  useEffect(() => {
    localStorage.setItem("fontIndex", JSON.stringify(fontIndex));
  }, [fontIndex]);

  // 根据时间自动切换主题
  // const timeNow = new Date().getHours();
  // const [isDarkMode, setIsDarkMode] = useState(timeNow < 7 || timeNow > 19);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

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
    // console.log(newTitle);
    if (!/^[A-Za-z]/.test(newTitle[0])) {
      // 处理中文原句，去除符号
      newTitle = newTitle.replace(/[^\u4E00-\u9FA5\t\n\r]/g, " ");
      // 合并空格
      newTitle = newTitle.replace(/\s+/g, " ").trim();
      // 格式化句子

      if (newTitle.length >= POEM_MAXLINELENGTH) {
        const lines = newTitle.split(/\s+/);
        // console.log(lines);
        // 偶数个句子则每两个句子拼接成一行，奇数个句子则每个句子单独一行
        const mod = lines.length % 2;
        // console.log(mod);
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

        // console.log(result);
        newTitle = result.join("\n");
      }
    }

    setPoem({ ...poem, title: newTitle });
  }, []);

  useEffect(() => {
    const hasZh = navigator.languages.includes("zh");
    document.title = hasZh ? "新标签页" : "New Tab";
  }, []);

  // 第一次使用的引导
  useEffect(() => {
    const storedFirstRun = localStorage.getItem("firstRun");
    if (!storedFirstRun || storedFirstRun === "1") {
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
            localStorage.setItem("firstRun", "0");
          }
        },
        steps: [
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
        ],
      });
      driverObj.drive();
    }
  }, []);

  return (
    <div
      id="app"
      className="custom-font animate__animated animate__fadeIn animate__faster"
      style={{
        "--custom-font-name": FONTNAME_LIST[fontIndex],
        // } as any
      }}
    >
      {/* <div>
        <img className="absolute left-0 top-0 transform scale-x-[-1] z-0 w-64" src="./2.png" />
        <img className="absolute right-0 top-0 z-50 w-64" src="./2.png" />
        
      </div> */}
      <div className="min-h-screen flex items-center justify-center">
        <div className="justify-center text-center">
          <div className="justify-center item-center flex flex-col">
            <p className="text-5xl mb-10 whitespace-pre-wrap">
              <a href={`https://www.baidu.com/s?wd=${poem.title.replace("\n", " ")}`} target="_blank">
                {poem.title}
              </a>
            </p>
          </div>
          <div className="flex justify-center">
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
                onChange={() => setIsDarkMode(!isDarkMode)}
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
