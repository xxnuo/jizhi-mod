import SENTENCES from "sentences-bundle/sentences/i.json";

export const LIBRARY = SENTENCES.map(
  ({ uuid, id, hitokoto, from, from_who }) => ({
    id: uuid || String(id),
    title: hitokoto,
    from,
    who: from_who || "",
  }),
);
