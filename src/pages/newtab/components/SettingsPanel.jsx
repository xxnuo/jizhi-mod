import { IoMoonOutline as MoonIcon, IoSunnyOutline as SunIcon } from "react-icons/io5";
import { MdTimelapse as SyncIcon } from "react-icons/md";
import { BiFontFamily as FontIcon } from "react-icons/bi";
import { IoVolumeHighOutline as VolumeOnIcon, IoVolumeMuteOutline as VolumeOffIcon } from "react-icons/io5";

export default function SettingsPanel({ theme, onThemeToggle, onFontToggle, isMuted, onMuteToggle }) {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex">
      <div className="tooltip" data-tip={`${theme === "sync" ? "系统主题" : theme === "dark" ? "深色主题" : "浅色主题"}`}>
        <button
          id="theme-toggle"
          className="custom-settings-button-style transition-all duration-300 hover:scale-110"
          onClick={onThemeToggle}
          type="button"
        >
          {theme === "light" && <SunIcon className="swap-on fill-current w-8 h-8" />}
          {theme === "dark" && <MoonIcon className="swap-on fill-current w-8 h-8" />}
          {theme === "sync" && <SyncIcon className="swap-on fill-current w-8 h-8" />}
        </button>
      </div>

      <div className="ml-4" />
      <div className="tooltip" data-tip="切换字体">
        <div id="font-toggle" className="custom-settings-button-style transition-all duration-300 hover:scale-110">
          <label className="swap">
            <input type="checkbox" onClick={onFontToggle} />
            <FontIcon className="swap-on fill-current w-8 h-8" />
            <FontIcon className="swap-off fill-current w-8 h-8" />
          </label>
        </div>
      </div>

      <div className="ml-4" />
      <div className="tooltip" data-tip="静音">
        <div id="mute-toggle" className="custom-settings-button-style transition-all duration-300 hover:scale-110">
          <label className="swap">
            <input type="checkbox" checked={isMuted} onChange={onMuteToggle} />
            <VolumeOffIcon className="swap-on fill-current w-8 h-8" />
            <VolumeOnIcon className="swap-off fill-current w-8 h-8" />
          </label>
        </div>
      </div>
    </div>
  );
} 