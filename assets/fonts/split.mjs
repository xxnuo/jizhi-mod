import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const base = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(base, "../..");
const revision = "6ba8b01e2415e6dd7cd6f67890806ed23175a31b";
const sources = [
  ["lxgwwenkai", "LXGWWenKai-Light", "LXGW WenKai Light"],
  ["mzxst", "MZPXorig", "MuzaiPixel"],
  ["ysfxt", "Slidefu-Regular", "Slidefu"],
  ["yfxy", "YuFanXinYu-Regular", "YuFanXinYu"],
  ["rzjkxzdmh", "nzgrKangxi", "nzgrKangxi"],
  ["hldqjt", "qiji-fallback", "QIJIFALLBACK"],
  ["jhlst", "京華老宋体v2.002", "KingHwa_OldSong"],
];

async function readTexts(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const texts = await Promise.all(
    entries.map((entry) => {
      const filename = path.join(directory, entry.name);
      return entry.isDirectory()
        ? readTexts(filename)
        : /\.(jsx?|css|html)$/.test(entry.name)
          ? fs.readFile(filename, "utf8")
          : "";
    }),
  );
  return texts.join("\n");
}

async function main() {
  const text =
    (await readTexts(path.join(root, "src"))) +
    (await readTexts(path.join(root, "entrypoints"))) +
    (await fs.readFile(
      path.join(root, "node_modules/sentences-bundle/sentences/i.json"),
      "utf8",
    ));
  const charset = [...new Set(text)]
    .map((character) => character.codePointAt(0))
    .sort((a, b) => a - b);
  console.log(`生成字符集：${charset.length} 个码点，包含页面文案及全部语句库`);
  const srcDir = path.join(base, ".src");
  await fs.mkdir(srcDir, { recursive: true });
  await fs.writeFile(
    path.join(srcDir, "charset.json"),
    JSON.stringify(charset),
  );
  const staging = await fs.mkdtemp(path.join(base, ".build-"));
  try {
    for (const [pkg, name, family] of sources) {
      const source = path.join(srcDir, `${name}.ttf`);
      try {
        await fs.access(source);
      } catch {
        const url = `https://raw.githubusercontent.com/KonghaYao/chinese-free-web-font-storage/${revision}/packages/${pkg}/fonts/${encodeURIComponent(name)}.ttf`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(120000),
        });
        if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
        await fs.writeFile(
          source,
          new Uint8Array(await response.arrayBuffer()),
        );
      }
      execFileSync(
        "uv",
        [
          "run",
          "--with",
          "fonttools",
          "--with",
          "brotli",
          "python",
          path.join(base, "subset.py"),
          source,
          path.join(staging, name),
          family,
          path.join(srcDir, "charset.json"),
        ],
        { stdio: "inherit" },
      );
      console.log(`已生成 ${name}`);
    }
    await fs.rm(path.join(base, "build"), { recursive: true, force: true });
    await fs.rename(staging, path.join(base, "build"));
    await fs.writeFile(
      path.join(base, "fonts.css"),
      sources
        .map(([, name]) => `@import "./build/${name}/result.css";`)
        .join("\n") + "\n",
    );
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
