import React from "react";
import "./BrutalButton.css";

export default function BrutalButton({
  children,
  className = "",
  tone = "default",
  arrow = "→",
  type = "button",
  ...props
}) {
  const toneClass = tone === "on-dark" ? "brutal-btn--on-dark" : "";
  const finalClassName = ["brutal-btn", toneClass, className].filter(Boolean).join(" ");

  return (
    <button type={type} className={finalClassName} {...props}>
      <span>{children}</span>
      <span className="arrow" aria-hidden="true">
        {arrow}
      </span>
    </button>
  );
}
