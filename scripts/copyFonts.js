// 拷贝 ./node_modules/@chinese-fonts 到 ./components/fonts

const fs = require("fs");
const path = require("path");

const src = path.resolve(__dirname, "../node_modules/@chinese-fonts");
const dest = path.resolve(__dirname, "../components/fonts");

// 确保目标目录存在，如果不存在则创建
if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

// 拷贝目录的函数
function copyDir(src, dest) {
  const files = fs.readdirSync(src);
  for (const file of files) {
    const curSrc = path.join(src, file);
    const curDest = path.join(dest, file);
    if (fs.lstatSync(curSrc).isDirectory()) {
      // 如果是目录，递归拷贝
      if (!fs.existsSync(curDest)) {
        fs.mkdirSync(curDest);
      }
      copyDir(curSrc, curDest);
    } else {
      // 如果是文件，直接拷贝
      fs.copyFileSync(curSrc, curDest);
    }
  }
}

// 开始拷贝
copyDir(src, dest);

console.log("所需字体文件更新拷贝完成");
