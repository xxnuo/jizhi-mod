import { LIBRARY, CATEGORIES } from "./library";
export { CATEGORIES };

export function getRandomPoem(categories = CATEGORIES, previousId) {
  const pool = LIBRARY.filter((poem) => categories.includes(poem.category));
  const candidates = pool.filter((poem) => poem.id !== previousId);
  const choices = candidates.length ? candidates : pool.length ? pool : LIBRARY;
  return choices[Math.floor(Math.random() * choices.length)];
}

export function formatPoem(text) {
  return text.replace(/([，。！？；])\s*/g, "$1\n").trim();
}

export function poemText(poem) {
  return `${poem.title}\n——${poem.who}《${poem.from}》`;
}
