import type { ButtonHTMLAttributes } from "react";
import "./IconButton.css";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  tone?: "neutral" | "danger";
}

export function IconButton({
  size = "md",
  tone = "neutral",
  className = "",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button type={type} className={`abtn abtn--${size} abtn--${tone} ${className}`.trim()} {...props} />
  );
}
