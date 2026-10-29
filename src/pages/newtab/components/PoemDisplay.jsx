import { formatPoem } from "../services/poems";

export default function PoemDisplay({
  poem,
  vertical,
  onTitleClick,
  onDetails,
}) {
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
        <button type="button" onClick={onDetails} aria-label="查看全文与释义">
          「{poem.from}」
        </button>
        <button
          type="button"
          onClick={onDetails}
          className="custom-author-style author-seal"
          aria-label="查看作者背景"
        >
          {poem.who}
        </button>
      </div>
    </article>
  );
}
