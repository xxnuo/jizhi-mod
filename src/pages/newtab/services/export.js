import { formatPoem } from "./poems";
import { artworkUrl, backgroundRect } from "./artwork";
import paperTexture from "../../../../assets/textures/chinese-paper.png";

async function drawBackground(context, canvas, colors) {
  const load = async (url) => {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  };
  const [paper, artwork, frame] = await Promise.all([
    colors.texture ? load(paperTexture) : undefined,
    colors.artwork ? load(artworkUrl(colors.artwork.file)) : undefined,
    colors.frame?.file ? load(artworkUrl(colors.frame.file)) : undefined,
  ]);
  context.save();
  if (paper) {
    context.fillStyle = context.createPattern(paper, "repeat");
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.globalAlpha = colors.dark ? 0.35 : 0.55;
  if (artwork) {
    const rect = backgroundRect(
      artwork.width,
      artwork.height,
      canvas.width,
      canvas.height,
      colors.artworkFill,
      canvas.width / 1080,
    );
    context.globalAlpha *= 0.6;
    context.drawImage(artwork, rect.x, rect.y, rect.width, rect.height);
  }
  context.globalAlpha = colors.dark ? 0.35 : 0.55;
  if (frame) {
    const scale = Math.min(
      (canvas.width * 192) / 1080 / frame.width,
      (canvas.height * 0.24) / frame.height,
    );
    const width = frame.width * scale;
    const height = frame.height * scale;
    const inset = (canvas.width * 20) / 1080;
    const left = colors.framePosition.endsWith("-left");
    const top = colors.framePosition.startsWith("top-");
    context.drawImage(
      frame,
      left ? inset : canvas.width - width - inset,
      top ? inset : canvas.height - height - inset,
      width,
      height,
    );
  }
  context.restore();
}

export async function exportPoem(poem, font, vertical, colors) {
  await document.fonts.load(
    `48px "${font}"`,
    `${poem.title}${poem.from}${poem.who}`,
  );
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 2160;
  canvas.height = 2880;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器不支持图片导出");
  context.fillStyle = colors.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  await drawBackground(context, canvas, colors);
  context.fillStyle = colors.foreground;
  const lines = formatPoem(poem.title).split("\n");
  const size = Math.min(
    110,
    vertical
      ? 1400 / 1.35 / Math.max(...lines.map((line) => [...line].length))
      : 1800 / Math.max(...lines.map((line) => [...line].length)),
    1400 / (lines.length * 1.8),
  );
  context.font = `${size}px "${font}", "LXGW WenKai Light", serif`;
  context.textBaseline = "alphabetic";
  const drawText = (text, x, y, maxWidth = 1800) => {
    const metrics = context.measureText(text);
    context.fillText(
      text,
      x,
      y +
        (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) /
          2,
      maxWidth,
    );
  };
  if (vertical) {
    context.textAlign = "center";
    const right = canvas.width / 2 + (lines.length - 1) * size;
    lines.forEach((line, column) =>
      [...line].forEach((character, row) =>
        drawText(character, right - column * size * 2, 700 + row * size * 1.35),
      ),
    );
  } else {
    context.textAlign = "center";
    lines.forEach((line, index) =>
      drawText(
        line,
        1080,
        1200 + (index - (lines.length - 1) / 2) * size * 1.8,
      ),
    );
  }
  context.textAlign = "center";
  context.font = `54px "${font}", "LXGW WenKai Light", serif`;
  drawText(`「${poem.from}」`, 1080, 2250, 1800);
  if (poem.who) {
    const sealWidth = Math.max(100, context.measureText(poem.who).width + 48);
    context.fillStyle = "#a52e2e";
    context.fillRect(1080 - sealWidth / 2, 2370, sealWidth, 90);
    context.fillStyle = "#fff";
    drawText(poem.who, 1080, 2415);
  }
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("图片生成失败");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${poem.from.replace(/[\\/:*?"<>|]/g, "_")}.png`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
