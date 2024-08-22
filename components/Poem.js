import JSON_POEM from "sentences-bundle/sentences/i.json";

// const JSON_POEM = [
//   {
//     id: 6615,
//     uuid: "067fd14f-defb-4637-95f1-2673c9969090",
//     hitokoto: "We can bring to birth a new world from the ashes of the old.",
//     type: "i",
//     from: "Solidarity Forever",
//     from_who: "Pete Seeger",
//     creator: "Forevercontinent",
//     creator_uid: 7134,
//     reviewer: 6844,
//     commit_from: "web",
//     created_at: "1603517855",
//     length: 60,
//   },
// ];

/**
 * @typedef {Object} Poem
 * @property {string} title - 诗的标题
 * @property {string} from - 诗的来源
 * @property {string} who - 诗的作者
 */

/**
 * @returns {Poem} 返回一个随机的诗句对象
 */
export function getRandomPoem() {
  const randomIndex = Math.floor(Math.random() * JSON_POEM.length);
  const poem = JSON_POEM[randomIndex];
  // const poem = JSON_POEM[0];
  return {
    title: poem.hitokoto,
    from: poem.from,
    who: poem.from_who,
  };
}
