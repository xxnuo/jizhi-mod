import { fontSplit } from "cn-font-split";
import fs from "fs/promises";

import * as OpenCC from "opencc-js";
const OpenCCConverter = OpenCC.Converter({ from: "cn", to: "t" });

// 包含需要用到的所有字符的文件们
const textSrc = [
  "../../node_modules/sentences-bundle/sentences/i.json",
  "../../Layout.jsx",
  "../../App.jsx",
  "../../entrypoints/newtab/index.html",
  "../../entrypoints/background.js",
];

async function main() {
  console.log("根据下列文件生成字符集：");
  console.log(textSrc);
  // 读取源文件
  let text = "";
  for (const src of textSrc) {
    text += await fs.readFile(src, "utf-8");
  }

  console.log(`文本长度: ${text.length}`);

  // 添加繁体字
  text += OpenCCConverter(text);

  // 生成字符集
  const charset = [...new Set(text)].map((char) => char.charCodeAt(0));
  console.log(`唯一字符数: ${charset.length}`);

  // 获取字体文件列表
  const srcDir = "./src/";
  const buildDir = "./build/";
  const fontList = await fs.readdir(srcDir);
  console.log(`字体文件: ${fontList.join(", ")}`);

  // 清空 build 目录的子目录并忽略错误
  await fs.rm(buildDir, { recursive: true, force: true });
  await fs.mkdir(buildDir, { recursive: true });

  // 处理每个字体文件
  let resultCss = "";
  for (const font of fontList) {
    const fontName = font.replace(".ttf", "");
    await fontSplit({
      FontPath: srcDir + font,
      destFold: buildDir + fontName,
      subsets: [charset],
      autoChunk: false,
      targetType: "woff2",
      reporter: false,
      testHTML: false,
    });
    resultCss += `@import "${buildDir}${fontName}/result.css";\n`;
    console.log(`处理完成: ${font}`);
  }
  // 写入 fonts.css
  await fs.writeFile("./fonts.css", resultCss, "utf-8");
}

main().catch(console.error);
