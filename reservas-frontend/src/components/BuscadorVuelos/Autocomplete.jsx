import React, { useState } from "react";
import "./Autocomplete.css";

export default function Autocomplete({ options = [], value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  const filteredOptions = options.filter(
    (opt) => opt.toLowerCase().includes(inputValue.toLowerCase()) && opt !== value
  );

  return (
    <div className="autocomplete-container">
      <div
        className={`chip ${value ? "selected" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {value || placeholder}
      </div>
      {open && (
        <div className="autocomplete-dropdown">
          {filteredOptions.map((opt) => (
            <div
              key={opt}
              className="autocomplete-option"
              onClick={() => {
                onChange(opt);
                setInputValue("");
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
