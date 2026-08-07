import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import "./Input.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  trailing?: ReactNode;
  mono?: boolean;
}

export function Input({
  label,
  error,
  trailing,
  mono = false,
  className = "",
  id,
  ...props
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="field__wrap">
        <input
          id={inputId}
          className={`input ${mono ? "input--mono" : ""} ${trailing ? "input--trailing" : ""} ${className}`.trim()}
          {...props}
        />
        {trailing && <div className="field__actions">{trailing}</div>}
      </div>
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}
