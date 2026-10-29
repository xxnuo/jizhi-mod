import { formatPoem } from "./poems";
import { artworkUrl, backgroundRect } from "./artwork";
import paperTexture from "../../../../assets/textures/chinese-paper.png";
import { CARD_RATIOS, CARD_MARGINS } from "./cardRatios";

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
    const left = colors.framePosition.endsWith("-left");
    const top = colors.framePosition.startsWith("top-");
    context.drawImage(
      frame,
      left ? 0 : canvas.width - width,
      top ? 0 : canvas.height - height,
      width,
      height,
    );
  }
  context.restore();
}

export async function exportPoem(
  poem,
  font,
  vertical,
  colors,
  ratio,
  margin = "medium",
) {
  if (!Object.hasOwn(CARD_RATIOS, ratio)) throw new Error("不支持的卡片比例");
  if (!Object.hasOwn(CARD_MARGINS, margin)) throw new Error("不支持的卡片边距");
  await document.fonts.load(
    `48px "${font}"`,
    `${poem.title}${poem.from}${poem.who}`,
  );
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = CARD_RATIOS[ratio].width;
  canvas.height = CARD_RATIOS[ratio].height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("浏览器不支持图片导出");
  context.fillStyle = colors.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  await drawBackground(context, canvas, colors);
  context.save();
  const contentScale = CARD_MARGINS[margin].scale;
  context.translate(canvas.width / 2, canvas.height / 2);
  context.scale(contentScale, contentScale);
  context.translate(-canvas.width / 2, -canvas.height / 2);
  context.fillStyle = colors.foreground;
  const lines = formatPoem(poem.title).split("\n");
  const maxWidth = canvas.width * Math.min(0.8, 0.9 / contentScale);
  const maxHeight = canvas.height * Math.min(0.62, 0.72 / contentScale);
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  const setFont = (size) => {
    context.font = `${size}px "${font}", "LXGW WenKai Light", serif`;
  };
  const drawText = (text, x, y) => {
    const metrics = context.measureText(text);
    context.fillText(
      text,
      x,
      y +
        (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) /
          2,
    );
  };
  if (vertical) {
    const sourceSize = Math.min(
      54,
      maxHeight / (([...poem.from].length + [...poem.who].length) * 1.25 + 1.5),
    );
    const size = Math.min(
      110,
      maxHeight / (Math.max(...lines.map((line) => [...line].length)) * 1.35),
      (maxWidth - sourceSize * 1.5) / (lines.length * 1.9 + 1.5),
    );
    const sourceWidth = sourceSize * 1.5;
    const bodyWidth = size + (lines.length - 1) * size * 1.9;
    const left = (canvas.width - bodyWidth - sourceWidth - size * 1.5) / 2;
    const bodyHeight =
      size +
      (Math.max(...lines.map((line) => [...line].length)) - 1) * size * 1.35;
    const sealHeight = poem.who
      ? [...poem.who].length * sourceSize * 1.25 + sourceSize * 0.6
      : 0;
    const sourceHeight =
      [...poem.from].length * sourceSize * 1.25 +
      (poem.who ? sourceSize * 0.75 + sealHeight : 0);
    const top = (canvas.height - Math.max(bodyHeight, sourceHeight)) / 2;
    const right = left + sourceWidth + size * 1.5 + bodyWidth - size / 2;
    setFont(size);
    lines.forEach((line, column) =>
      [...line].forEach((character, row) =>
        drawText(
          character,
          right - column * size * 1.9,
          top + size / 2 + row * size * 1.35,
        ),
      ),
    );
    setFont(sourceSize);
    const sourceX = left + sourceWidth / 2;
    [...poem.from].forEach((character, row) =>
      drawText(
        character,
        sourceX,
        top + sourceSize / 2 + row * sourceSize * 1.25,
      ),
    );
    if (poem.who) {
      const sealTop =
        top + [...poem.from].length * sourceSize * 1.25 + sourceSize * 0.75;
      context.fillStyle = "#a52e2e";
      context.fillRect(left, sealTop, sourceWidth, sealHeight);
      context.fillStyle = "#fff";
      [...poem.who].forEach((character, row) =>
        drawText(
          character,
          sourceX,
          sealTop + sourceSize * 0.8 + row * sourceSize * 1.25,
        ),
      );
    }
  } else {
    setFont(110);
    const size = Math.min(
      110,
      (110 * maxWidth) /
        Math.max(...lines.map((line) => context.measureText(line).width)),
      maxHeight / (lines.length * 1.8),
    );
    setFont(54);
    const source = `「${poem.from}」`;
    const sourceWidth = context.measureText(source).width;
    const sealWidth = poem.who ? context.measureText(poem.who).width + 48 : 0;
    const gap = poem.who ? 48 : 0;
    const sourceScale = Math.min(1, maxWidth / (sourceWidth + sealWidth + gap));
    const rowHeight = (poem.who ? 90 : 54) * sourceScale;
    const bodyHeight = size + (lines.length - 1) * size * 1.8;
    const top = (canvas.height - bodyHeight - size * 0.9 - rowHeight) / 2;
    setFont(size);
    lines.forEach((line, index) =>
      drawText(line, canvas.width / 2, top + size / 2 + index * size * 1.8),
    );
    setFont(54 * sourceScale);
    const left =
      (canvas.width - (sourceWidth + sealWidth + gap) * sourceScale) / 2;
    const sourceY = top + bodyHeight + size * 0.9 + rowHeight / 2;
    drawText(source, left + (sourceWidth * sourceScale) / 2, sourceY);
    if (poem.who) {
      const sealLeft = left + (sourceWidth + gap) * sourceScale;
      context.fillStyle = "#a52e2e";
      context.fillRect(
        sealLeft,
        sourceY - rowHeight / 2,
        sealWidth * sourceScale,
        rowHeight,
      );
      context.fillStyle = "#fff";
      drawText(poem.who, sealLeft + (sealWidth * sourceScale) / 2, sourceY);
    }
  }
  context.restore();
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
