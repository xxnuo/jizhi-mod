import { artworkUrl } from "../services/artwork";

export default function ArtworkPicker({
  label,
  options,
  value,
  setting,
  settingLabel,
  settings,
  onSelect,
  onSettingChange,
}) {
  return (
    <fieldset className="artwork-picker">
      <legend>{label}</legend>
      <label>
        <span>{settingLabel}</span>
        <select
          value={setting}
          onChange={(event) => onSettingChange(event.target.value)}
        >
          {Object.entries(settings).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <div className="image-options">
        {Object.entries(options).map(([id, item]) => (
          <button
            key={id}
            type="button"
            value={id}
            aria-pressed={value === id}
            onClick={() => onSelect(id)}
          >
            <span className="image-preview" aria-hidden="true">
              {item.file ? (
                <img src={artworkUrl(item.file)} alt="" loading="lazy" />
              ) : (
                "—"
              )}
            </span>
            <span>{item.name}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
