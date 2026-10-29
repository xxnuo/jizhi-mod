import { ENGINES } from "../services/preferences";
import { formatPoem } from "../services/poems";

export default function PoemDisplay({ poem, vertical, onTitleClick, engine }) {
  return (
    <article
      key={poem.id}
      className={`poem ${vertical ? "poem-vertical" : ""}`}
      aria-label="当前诗词"
    >
      <button
        id="poem-title-container"
        className="poem-title"
        onClick={onTitleClick}
        type="button"
        title="朗读 / 暂停（S）"
      >
        {formatPoem(poem.title)}
      </button>
      <div id="poem-author-container" className="poem-source">
        <a
          href={
            ENGINES[engine] +
            encodeURIComponent(`${poem.from} ${poem.who}`.trim())
          }
          target="_blank"
          rel="noopener noreferrer"
          className="source-title"
          aria-label="搜索诗词出处"
        >
          {vertical ? poem.from : `「${poem.from}」`}
        </a>
        {poem.who && (
          <a
            href={ENGINES[engine] + encodeURIComponent(poem.who)}
            target="_blank"
            rel="noopener noreferrer"
            className="custom-author-style author-seal"
            aria-label="搜索作者"
          >
            {poem.who}
          </a>
        )}
      </div>
    </article>
  );
}
