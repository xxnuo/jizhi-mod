import { useEffect, useState } from "react";
import {
  BACKGROUNDS,
  BACKGROUND_GROUPS,
  colorInk,
} from "../services/preferences";

export default function BackgroundPicker({ value, onChange }) {
  const [group, setGroup] = useState(BACKGROUNDS[value]?.group || "常用");
  useEffect(() => {
    setGroup(BACKGROUNDS[value]?.group || "常用");
  }, [value]);
  return (
    <fieldset className="background-picker">
      <legend>色调</legend>
      <div className="color-groups" role="group" aria-label="色系">
        {BACKGROUND_GROUPS.map((name) => (
          <button
            type="button"
            key={name}
            aria-pressed={group === name}
            onClick={() => setGroup(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="color-swatches" role="group" aria-label="背景色签">
        {Object.entries(BACKGROUNDS)
          .filter(([, color]) => (color.group || "常用") === group)
          .map(([id, color]) => (
            <button
              type="button"
              key={id}
              aria-pressed={value === id}
              aria-label={color.light ? `选用${color.name}` : color.name}
              title={
                color.light
                  ? `${color.name} ${color.light.toUpperCase()}`
                  : color.name
              }
              style={{
                "--swatch-color": color.light,
                color: color.light ? colorInk(color.light) : undefined,
              }}
              onClick={() => onChange(id)}
            >
              <span>{color.name}</span>
            </button>
          ))}
      </div>
    </fieldset>
  );
}
