import { useEffect } from "react";

export default function PoemDisplay({ poem, isAnimating, onTitleClick }) {
  useEffect(() => {
    document.title = navigator.languages.includes("zh") ? "新标签页" : "New Tab";
  }, []);

  return (
    <div className={`justify-center text-center ${isAnimating ? "animate__animated animate__fadeIn animate__faster" : ""}`}>
      <div className="justify-center item-center flex flex-col">
        <button
          id="poem-title-container"
          className="text-5xl mb-10 whitespace-pre-wrap cursor-pointer transition-all duration-300 hover:scale-105"
          onClick={onTitleClick}
          onKeyDown={(e) => e.key === 'Enter' && onTitleClick()}
          type="button"
        >
          {poem.title}
        </button>
      </div>
      <div id="poem-author-container" className="flex justify-center">
        <p className="text-3xl mr-4 transition-all duration-300 hover:text-opacity-80">
          <a href={`https://www.baidu.com/s?wd=${poem.from} ${poem.who || ""}`} target="_blank" rel="noopener noreferrer">
            「{poem.from}」
          </a>
        </p>
        {poem.who && (
          <p className="flex align-items-center justify-center text-center text-2xl rounded-md px-2 py-0 custom-author-style transition-all duration-300 hover:opacity-80">
            <a className="leading-normal" href={`https://www.baidu.com/s?wd=${poem.who}`} target="_blank" rel="noopener noreferrer">
              {poem.who}
            </a>
          </p>
        )}
      </div>
    </div>
  );
} 