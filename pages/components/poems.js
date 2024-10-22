import JSON_POEM from "sentences-bundle/sentences/i.json";

/**
 * @typedef {Object} Poem
 * @property {string} title - 诗句内容
 * @property {string} from - 诗句来源
 * @property {string} who - 诗句作者
 */

/**
 * 获取随机诗句
 * @returns {Poem} 返回一个随机的诗句对象
 */
export function getRandomPoem() {
  const randomIndex = Math.floor(Math.random() * JSON_POEM.length);
  const { hitokoto: title, from, from_who: who } = JSON_POEM[randomIndex];
  return { title, from, who };
}
