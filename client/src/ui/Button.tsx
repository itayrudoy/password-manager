import type { ButtonHTMLAttributes } from "react";
import "./Button.css";

type Variant = "primary" | "outline" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={`btn btn--${variant} ${className}`.trim()} {...props} />;
}
