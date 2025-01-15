import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function useGuide() {
  useEffect(() => {
    const steps = [];
    if (localStorage.getItem("firstRun") !== "0") {
      steps.push(
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
        }
      );
    }
    if (localStorage.getItem("update1voice") !== "0") {
      steps.push(
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
        }
      );
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
            localStorage.setItem("firstRun", "0");
            localStorage.setItem("update1voice", "0");
          }
        },
        steps: steps,
      });
      driverObj.drive();
    }
  }, []);
} 