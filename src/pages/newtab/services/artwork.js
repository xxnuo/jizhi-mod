// Artwork from zerosoul/chinese-colors; see public/licenses/chinese-colors.LICENSE.
export const ARTWORKS = {
  none: {
    name: "无背景图",
  },
  lake: {
    name: "湖山清远",
    file: "background-hengshan.webp",
  },
  snow: {
    name: "雪山长卷",
    file: "background-baishan.webp",
  },
  mist: {
    name: "远山",
    file: "background-qunshan.webp",
  },
  sunrise: {
    name: "青山红日",
    file: "background-bottom.qunshan.webp",
  },
  lotusfish: {
    name: "荷塘游鱼",
    file: "background-hehua.yu.shan.webp",
  },
  fisherman: {
    name: "江上渔舟",
    file: "background-yuweng.webp",
  },
  immortals: {
    name: "醉八仙",
    file: "background-zuibaxian.webp",
  },
};
export const FRAMES = {
  none: {
    name: "无边饰",
  },
  landscape: {
    name: "桂林山水",
    file: "guilinshanshui.webp",
  },
  bamboo: {
    name: "墨竹",
    file: "mozhu.webp",
  },
  lotus: {
    name: "彩荷",
    file: "hehua.caise.webp",
  },
  moon: {
    name: "明月",
    file: "moon.webp",
  },
  cranes: {
    name: "双鹤",
    file: "he.webp",
  },
  crane: {
    name: "独鹤",
    file: "ddh.webp",
  },
  sailboats: {
    name: "帆影",
    file: "fanchuan.webp",
  },
  orchid: {
    name: "兰草",
    file: "cao.webp",
  },
  lotusleaf: {
    name: "墨荷",
    file: "guohua.hehua.webp",
  },
  lotuspond: {
    name: "荷塘",
    file: "guohua.hehua2.webp",
  },
  lotusbird: {
    name: "荷鸟",
    file: "hehuayu.webp",
  },
  butterfly: {
    name: "彩蝶",
    file: "hudie.webp",
  },
  goldfish: {
    name: "金鱼",
    file: "jinyu.webp",
  },
  vase: {
    name: "花瓶",
    file: "huaping.webp",
  },
  moonflower: {
    name: "花月",
    file: "flower.moon.webp",
  },
  moonmountain: {
    name: "山月",
    file: "sundown.webp",
  },
  plumvase: {
    name: "瓶梅",
    file: "bottle.mei.webp",
  },
  flowervase: {
    name: "菊瓶",
    file: "right.bottom.huaping.webp",
  },
  shrimp: {
    name: "墨虾",
    file: "xia.webp",
  },
  blossom: {
    name: "桃花",
    file: "fenhua.webp",
  },
  plum: {
    name: "梅枝",
    file: "left.mei.webp",
  },
  birds: {
    name: "花鸟",
    file: "huaniao.webp",
  },
  flowers: {
    name: "花枝",
    file: "guohua.hua.webp",
  },
  redblossom: {
    name: "红花",
    file: "honghua.webp",
  },
  camellia: {
    name: "山茶",
    file: "liangduohua.webp",
  },
  winterbirds: {
    name: "冬雀",
    file: "lianiao.webp",
  },
  redplum: {
    name: "红梅",
    file: "luohong.webp",
  },
  greenbamboo: {
    name: "翠竹",
    file: "lvzhu.webp",
  },
  pinkplum: {
    name: "粉梅",
    file: "meihua.pink.webp",
  },
  sparseplum: {
    name: "疏梅",
    file: "meihua.webp",
  },
  inkplum: {
    name: "墨梅",
    file: "meihua.shuimo.webp",
  },
  magnolia: {
    name: "玉兰",
    file: "mujin.webp",
  },
  pine: {
    name: "青松",
    file: "song.webp",
  },
  bambooleaves: {
    name: "竹叶",
    file: "zhuzi.webp",
  },
  inkbamboo: {
    name: "竹影",
    file: "huizhuzi.webp",
  },
  pinkflowers: {
    name: "木槿",
    file: "right.bottom.hongmujin.webp",
  },
  wall: {
    name: "墙檐",
    file: "qiangyan.webp",
  },
};
export const POSITIONS = {
  "top-left": "左上角",
  "top-right": "右上角",
  "bottom-left": "左下角",
  "bottom-right": "右下角",
};
export const FILLS = {
  cover: "铺满「裁切」",
  contain: "完整显示",
  fill: "拉伸填充",
  none: "原尺寸居中",
};
export function artworkFor(value) {
  const artwork = ARTWORKS[value];
  return artwork?.file ? artwork : undefined;
}
export function artworkUrl(file) {
  return `/illustrations/${file}`;
}
export function backgroundRect(
  imageWidth,
  imageHeight,
  width,
  height,
  fill,
  pixelScale = 1,
) {
  let w = width,
    h = height;
  if (fill !== "fill") {
    const scale =
      fill === "none"
        ? pixelScale
        : Math[fill === "cover" ? "max" : "min"](
            width / imageWidth,
            height / imageHeight,
          );
    w = imageWidth * scale;
    h = imageHeight * scale;
  }
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}
