import { LIBRARY } from "./library";

export function getRandomPoem(previousId) {
  const candidates = LIBRARY.filter((poem) => poem.id !== previousId);
  const choices = candidates.length ? candidates : LIBRARY;
  return choices[Math.floor(Math.random() * choices.length)];
}

export function formatPoem(text) {
  return text.replace(/([，。！？；])\s*/g, "$1\n").trim();
}

export function poemText(poem) {
  return `${poem.title}\n——${poem.who || "佚名"}《${poem.from}》`;
}
