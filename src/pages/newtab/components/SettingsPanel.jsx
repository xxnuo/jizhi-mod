import { useRef, useState } from "react";
import {
  IoMenuOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoVolumeHighOutline,
  IoVolumeMuteOutline,
  IoSettingsOutline,
  IoHeartOutline,
  IoHeart,
  IoDownloadOutline,
  IoRefreshOutline,
  IoBookmarksOutline,
  IoCopyOutline,
} from "react-icons/io5";
import { MdTimelapse } from "react-icons/md";
import { BiFontFamily } from "react-icons/bi";
import { ENGINES } from "../services/preferences";
import BackgroundPicker from "./BackgroundPicker";
import ArtworkPicker from "./ArtworkPicker";
import { ARTWORKS, FRAMES, POSITIONS, FILLS } from "../services/artwork";

export function Preferences({ preferences, onChange }) {
  return (
    <div className="preferences">
      <label>
        <span>竖排排版</span>
        <input
          type="checkbox"
          checked={preferences.vertical}
          onChange={(event) => onChange({ vertical: event.target.checked })}
        />
      </label>
      <label>
        <span>默认搜索引擎</span>
        <select
          value={preferences.engine}
          onChange={(event) => onChange({ engine: event.target.value })}
        >
          {Object.keys(ENGINES).map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      <BackgroundPicker
        value={preferences.background}
        onChange={(background) => onChange({ background })}
      />
      <label>
        <span>宣纸纹理</span>
        <input
          type="checkbox"
          checked={preferences.texture}
          onChange={(event) => onChange({ texture: event.target.checked })}
        />
      </label>
      <ArtworkPicker
        label="国画配图"
        options={ARTWORKS}
        value={preferences.artwork}
        setting={preferences.artworkFill}
        settingLabel="填充样式"
        settings={FILLS}
        onSelect={(artwork) => onChange({ artwork })}
        onSettingChange={(artworkFill) => onChange({ artworkFill })}
      />
      <ArtworkPicker
        label="画面边饰"
        options={FRAMES}
        value={preferences.frame}
        setting={preferences.framePosition}
        settingLabel="边饰位置"
        settings={POSITIONS}
        onSelect={(frame) => onChange({ frame })}
        onSettingChange={(framePosition) => onChange({ framePosition })}
      />

      <p className="settings-help">
        空格 / 双击空白：换一句；F：字体；T：主题；C：复制；S：朗读 / 暂停；/
        或直接输入：搜索；Esc：关闭。
      </p>
      <p className="settings-help">离线朗读需要系统已安装中文语音包。</p>
    </div>
  );
}

export default function SettingsPanel({
  vertical,
  theme,
  onThemeToggle,
  onFontToggle,
  isMuted,
  onMuteToggle,
  onNext,
  onFavorite,
  favorite,
  onLibrary,
  onSettings,
  onExport,
  exporting,
  onCopy,
}) {
  const [open, setOpen] = useState(false);
  const drawerButton = useRef(null);
  const ThemeIcon =
    theme === "light"
      ? IoSunnyOutline
      : theme === "dark"
        ? IoMoonOutline
        : MdTimelapse;
  const VolumeIcon = isMuted ? IoVolumeMuteOutline : IoVolumeHighOutline;
  const buttons = [
    ["theme-toggle", "切换主题（T）", ThemeIcon, onThemeToggle],
    ["font-toggle", "切换字体（F）", BiFontFamily, onFontToggle],
    ["mute-toggle", isMuted ? "取消静音" : "静音", VolumeIcon, onMuteToggle],
    ["next-poem", "换一句（空格）", IoRefreshOutline, onNext],
    [
      "favorite",
      favorite ? "取消收藏" : "收藏",
      favorite ? IoHeart : IoHeartOutline,
      onFavorite,
    ],
    ["library", "收藏与历史", IoBookmarksOutline, onLibrary],
    ["copy", "复制诗句（C）", IoCopyOutline, onCopy],
    [
      "export",
      exporting ? "正在导出" : "导出诗词卡片",
      IoDownloadOutline,
      onExport,
    ],
    ["settings", "设置", IoSettingsOutline, onSettings],
  ];
  return (
    <nav
      className={`poem-toolbar ${vertical ? "toolbar-vertical" : ""}`}
      aria-label="诗词工具栏"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          drawerButton.current.focus();
          setOpen(false);
        }
      }}
    >
      <button
        ref={drawerButton}
        type="button"
        aria-label="诗词工具"
        aria-expanded={open}
        aria-controls="poem-tools"
        onClick={() => setOpen((previous) => !previous)}
      >
        <IoMenuOutline aria-hidden="true" />
      </button>
      <div id="poem-tools" className="toolbar-actions" hidden={!open}>
        {buttons.map(([id, label, Icon, action]) => (
          <button
            key={id}
            id={id}
            type="button"
            aria-label={label}
            title={label}
            disabled={id === "export" && exporting}
            aria-pressed={id === "favorite" ? favorite : undefined}
            onClick={action}
          >
            <Icon aria-hidden="true" />
            <span className="toolbar-label">{label.replace(/（.*）/, "")}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
