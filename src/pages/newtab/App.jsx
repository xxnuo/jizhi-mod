import { POEM_MAXLINELENGTH } from "./services/constants";
import { getRandomPoem } from "./services/poems";
import { useState, useEffect } from "react";
import "animate.css";
import "./App.css";
import PoemDisplay from "./components/PoemDisplay";
import SettingsPanel from "./components/SettingsPanel";
import { useTheme } from "./hooks/useTheme";
import { useFont } from "./hooks/useFont";
import { useVoice } from "./hooks/useVoice";
import { useGuide } from "./hooks/useGuide";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { currentFont, toggleFont } = useFont();
  const { isMuted, toggleMute, playVoice } = useVoice();
  const [poem, setPoem] = useState(() => getRandomPoem());
  const [isAnimating, setIsAnimating] = useState(true);

  useGuide();

  useEffect(() => {
    let newTitle = poem.title;
    if (!/^[A-Za-z]/.test(newTitle[0])) {
      newTitle = newTitle
        .replace(/[^\u4E00-\u9FA5\t\n\r]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (newTitle.length >= POEM_MAXLINELENGTH) {
        const lines = newTitle.split(/\s+/);
        const result =
          lines.length % 2 === 0
            ? lines.reduce(
                (acc, line, i) => {
                  if (i % 2 === 0) {
                    acc.push(line);
                  } else {
                    acc[acc.length - 1] = `${acc[acc.length - 1]} ${line}`;
                  }
                  return acc;
                },
                []
              )
            : lines;
        newTitle = result.join("\n");
      }
    }
    setPoem((prevPoem) => ({ ...prevPoem, title: newTitle }));
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [poem.title]);

  const handleTitleClick = () => {
    playVoice(poem.title);
  };

  return (
    <div id="app" className="custom-font" style={{ "--custom-font-name": currentFont }}>
      <div className="min-h-screen flex items-center justify-center">
        <PoemDisplay poem={poem} isAnimating={isAnimating} onTitleClick={handleTitleClick} />
      </div>

      <SettingsPanel
        theme={theme}
        onThemeToggle={toggleTheme}
        onFontToggle={toggleFont}
        isMuted={isMuted}
        onMuteToggle={toggleMute}
      />
    </div>
  );
}
