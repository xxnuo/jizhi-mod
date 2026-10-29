import { Converter } from "opencc-js/cn2t";
const toTraditional = Converter({ from: "cn", to: "t" });
export function displayPoem(poem, traditional) {
  return traditional
    ? Object.fromEntries(
        Object.entries(poem).map(([key, value]) => [
          key,
          ["title", "from", "who", "full", "meaning", "bio"].includes(key)
            ? toTraditional(value)
            : value,
        ]),
      )
    : poem;
}
export { poemText } from "./poems";
