// src/components/IconPicker/IconPicker.jsx
import React from "react";
import { ICON_REGISTRY, ICON_NAMES } from "../../utils/iconRegistry";
import "./IconPicker.css";

export default function IconPicker({ value, onChange, columns = 6 }) {
  return (
    <div className="icon-picker">
      <div
        className="icon-grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(40px, 1fr))`,
        }}
      >
        {ICON_NAMES.map((iconName) => {
          const IconComp = ICON_REGISTRY[iconName];
          const selected = value === iconName;
          return (
            <button
              key={iconName}
              className={`icon-option ${selected ? "selected" : ""}`}
              type="button"
              onClick={() => onChange(iconName)}
              title={iconName}
            >
              <IconComp />
            </button>
          );
        })}
      </div>
    </div>
  );
}
