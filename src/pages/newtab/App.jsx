import { useState, useEffect, useCallback } from "react";
import "./App.css";
import PoemDisplay from "./components/PoemDisplay";
import SettingsPanel, { Preferences } from "./components/SettingsPanel";
import Overlay from "./components/Overlay";
import { useTheme } from "./hooks/useTheme";
import { useFont } from "./hooks/useFont";
import { useVoice } from "./hooks/useVoice";
import { useLibrary } from "./hooks/useLibrary";
import { getRandomPoem, poemText } from "./services/poems";
import { LIBRARY } from "./services/library";
import { artworkFor, artworkUrl, frameFor } from "./services/artwork";
import {
  readPreferences,
  writeStorage,
  ENGINES,
  backgroundColor,
  selectedBackground,
  colorInk,
} from "./services/preferences";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { currentFont, toggleFont } = useFont();
  const [preferences, setPreferences] = useState(readPreferences);
  const [poem, setPoem] = useState(() => getRandomPoem());
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [tab, setTab] = useState("favorites");
  const notify = useCallback((message) => setNotice(message), []);
  const { isMuted, toggleMute, playVoice, stopVoice, status } =
    useVoice(notify);
  const { favorites, history, toggleFavorite } = useLibrary(poem, notify);
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [day, setDay] = useState(() => new Date());
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const change = () => setDark(media.matches);
    media.addEventListener("change", change);
    const timer = setInterval(() => setDay(new Date()), 60000);
    document.title = "浮生梦";
    return () => {
      media.removeEventListener("change", change);
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    stopVoice();
  }, [poem.id, stopVoice]);

  const nextPoem = useCallback(() => {
    setPoem((previous) => getRandomPoem(previous.id));
  }, []);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(poemText(poem));
      notify("已复制诗句及出处");
    } catch {
      notify("复制失败，请检查剪贴板权限");
    }
  }, [poem, notify]);
  function changePreferences(patch) {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    if (!writeStorage("preferences", next))
      notify("设置无法保存，浏览器存储空间不可用");
  }
  useEffect(() => {
    const keydown = (event) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        panel ||
        event.target.closest(
          "input, textarea, select, button, a, [contenteditable], dialog",
        )
      )
        return;
      if (event.key === "Process" || event.keyCode === 229) {
        setQuery("");
        setPanel("search");
        return;
      }
      const actions = {
        " ": nextPoem,
        f: toggleFont,
        t: toggleTheme,
        c: copy,
        s: () => playVoice(poem.title),
      };
      const key = event.key.toLowerCase();
      if (actions[key]) {
        event.preventDefault();
        actions[key]();
      } else if (event.key === "/" || event.key.length === 1) {
        event.preventDefault();
        setQuery(event.key === "/" ? "" : event.key);
        setPanel("search");
      }
    };
    const composition = (event) => {
      if (
        !panel &&
        !event.target.closest(
          "input, textarea, select, button, [contenteditable], dialog",
        ) &&
        event.data
      ) {
        setQuery(event.data);
        setPanel("search");
      }
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("compositionend", composition);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("compositionend", composition);
    };
  }, [panel, nextPoem, toggleFont, toggleTheme, copy, playVoice, poem]);

  async function download() {
    setExporting(true);
    try {
      const { exportPoem } = await import("./services/export");
      const app = document.getElementById("app");
      const color = getComputedStyle(app);
      await exportPoem(poem, currentFont, preferences.vertical, {
        background: color.backgroundColor,
        foreground: color.color,
        texture: preferences.texture,
        artwork,
        frame,
        artworkFill: preferences.artworkFill,
        framePosition: preferences.framePosition,
        dark: isDark,
      });
      notify("诗词卡片已导出");
    } catch {
      notify("导出失败，请稍后重试");
    } finally {
      setExporting(false);
    }
  }
  const ids = (tab === "favorites" ? favorites : history).filter((id) =>
    LIBRARY.some((entry) => entry.id === id),
  );
  const isDark = theme === "sync" ? dark : theme === "dark";
  const background = backgroundColor(preferences.background, isDark, day);
  const color = selectedBackground(preferences.background, day);
  const artwork = artworkFor(preferences.artwork);
  const frame = frameFor(preferences.frame, color);
  useEffect(() => {
    setShowBackground(true);
    const timer = setTimeout(() => setShowBackground(false), 3000);
    return () => clearTimeout(timer);
  }, [background]);
  return (
    <div
      id="app"
      className={`custom-font ${preferences.texture ? "paper-texture" : ""}`}
      style={{
        "--custom-font-name": currentFont,
        "--scene-opacity": isDark ? 0.35 : 0.55,
        ...(background
          ? {
              "--color-base-100": background,
              "--color-base-content": colorInk(background),
            }
          : {}),
      }}
      onDoubleClick={(event) => {
        if (
          event.target === event.currentTarget ||
          event.target.classList.contains("poem-stage")
        )
          nextPoem();
      }}
    >
      <div className="background-scene" aria-hidden="true">
        {artwork && (
          <img
            className="background-artwork"
            src={artworkUrl(artwork.file)}
            alt=""
            style={{ objectFit: preferences.artworkFill }}
          />
        )}
        {frame && (
          <img
            className="background-frame"
            src={artworkUrl(frame.file)}
            alt=""
            data-position={preferences.framePosition}
          />
        )}
      </div>
      {background && (
        <aside className="background-caption" aria-label="当前背景色">
          <div
            className="background-caption-content"
            data-show={showBackground}
          >
            <span>{color.name}</span>
            <small>{background.toUpperCase()}</small>
          </div>
        </aside>
      )}
      <main className="poem-stage">
        <PoemDisplay
          poem={poem}
          vertical={preferences.vertical}
          onTitleClick={() => playVoice(poem.title)}
          engine={preferences.engine}
        />
      </main>
      <SettingsPanel
        vertical={preferences.vertical}
        theme={theme}
        onThemeToggle={toggleTheme}
        onFontToggle={toggleFont}
        isMuted={isMuted}
        onMuteToggle={toggleMute}
        onNext={nextPoem}
        onSearch={() => {
          setQuery("");
          setPanel("search");
        }}
        onFavorite={toggleFavorite}
        favorite={favorites.includes(poem.id)}
        onLibrary={() => setPanel("library")}
        onSettings={() => setPanel("settings")}
        onExport={download}
        exporting={exporting}
        onCopy={copy}
      />
      <div className="notice" role="status">
        {notice ||
          (status === "loading"
            ? "正在准备朗读，再按 S 可取消"
            : status === "paused"
              ? "朗读已暂停"
              : status === "playing"
                ? "正在朗读"
                : "")}
      </div>
      {panel && (
        <Overlay
          key={panel}
          title={
            {
              search: "搜索",
              library: "收藏与历史",
              settings: "设置",
            }[panel]
          }
          onClose={() => setPanel(null)}
        >
          {panel === "settings" && (
            <Preferences
              preferences={preferences}
              onChange={changePreferences}
            />
          )}
          {panel === "search" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (query.trim())
                  window.location.assign(
                    ENGINES[preferences.engine] +
                      encodeURIComponent(query.trim()),
                  );
              }}
            >
              <label htmlFor="search-input">
                使用 {preferences.engine} 搜索
              </label>
              <input
                autoFocus
                id="search-input"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="输入搜索内容"
              />
              <button type="submit" disabled={!query.trim()}>
                搜索
              </button>
            </form>
          )}
          {panel === "library" && (
            <section>
              <div className="library-tabs" role="group" aria-label="切换列表">
                <button
                  aria-pressed={tab === "favorites"}
                  onClick={() => setTab("favorites")}
                >
                  收藏
                </button>
                <button
                  aria-pressed={tab === "history"}
                  onClick={() => setTab("history")}
                >
                  历史
                </button>
              </div>
              {!ids.length && <p>暂无收藏，遇到喜欢的诗句可点击工具栏收藏。</p>}
              <ul className="library-list">
                {ids.map((id) => {
                  const entry = LIBRARY.find((item) => item.id === id);
                  return (
                    <li key={id}>
                      <button
                        onClick={() => {
                          setPoem(LIBRARY.find((item) => item.id === id));
                          setPanel(null);
                        }}
                      >
                        {entry.title}
                        <small>
                          {entry.who} · {entry.from}
                        </small>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </Overlay>
      )}
    </div>
  );
}
