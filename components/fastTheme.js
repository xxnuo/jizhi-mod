// // index.html 中，通过 <script type="module" src="./components/fastTheme.js"></script> 引入

// // 闭包
// (function () {
//   // 具体设置指定主题
//   const applyTheme = (newTheme) => {
//     console.log("JS applyTheme", newTheme);
//     document.documentElement.setAttribute("data-theme", newTheme === "dark" ? DARK_THEME : LIGHT_THEME);
//   };

//   // 根据 theme 值，设置 data-theme 属性
//   const useTheme = (theme) => {
//     if (theme === "sync") {
//       //   查询系统主题
//       const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
//       applyTheme(mediaQuery.matches ? "dark" : "light");
//     } else {
//       applyTheme(theme);
//     }
//   };

//   // 初始化主题设置
//   const theme = localStorage.getItem("theme") || "sync";
//   useTheme(theme);
// })();
