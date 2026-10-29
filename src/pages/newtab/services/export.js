import { formatPoem } from "./poems";

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
  const sealWidth = Math.max(100, context.measureText(poem.who).width + 48);
  context.fillStyle = "#a52e2e";
  context.fillRect(1080 - sealWidth / 2, 2370, sealWidth, 90);
  context.fillStyle = "#fff";
  drawText(poem.who, 1080, 2415);
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
