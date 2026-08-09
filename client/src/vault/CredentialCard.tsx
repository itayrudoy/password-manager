import { useState } from "react";
import { Card } from "../ui/Card";
import { IconButton } from "../ui/IconButton";
import { Icon } from "../ui/Icon";
import { useCopyFeedback } from "../lib/useCopyFeedback";
import { logoColor } from "./logoColor";
import type { Credential } from "./types";
import "./CredentialCard.css";

const MASK = "•".repeat(10);

interface CredentialCardProps {
  item: Credential;
  onEdit: (item: Credential) => void;
  onDelete: (item: Credential) => void;
}

export function CredentialCard({ item, onEdit, onDelete }: CredentialCardProps) {
  const [revealed, setRevealed] = useState(false);
  const { copied, copy } = useCopyFeedback();

  const { title, username, url, password } = item;
  const initial = title.trim().charAt(0).toUpperCase() || "?";

  return (
    <Card className="row">
      <div className="row__logo" style={{ background: logoColor(title) }} aria-hidden="true">
        {initial}
      </div>

      <div className="row__name">
        <div className="row__title" title={title}>
          {title}
        </div>
        <div className="row__meta">
          {username && (
            <span className="row__pair">
              <span className="row__val">{username}</span>
              <IconButton
                size="sm"
                className={copied === "username" ? "is-copied" : ""}
                aria-label="Copy username"
                onClick={() => copy(username, "username")}
              >
                <Icon name={copied === "username" ? "check" : "copy"} size={14} />
                <span className="tip">Copied</span>
              </IconButton>
            </span>
          )}
          {username && url && <span className="row__sep">·</span>}
          {url && (
            <span className="row__pair">
              <span className="row__val row__val--site">{url}</span>
              <IconButton
                size="sm"
                className={copied === "url" ? "is-copied" : ""}
                aria-label="Copy website"
                onClick={() => copy(url, "url")}
              >
                <Icon name={copied === "url" ? "check" : "copy"} size={14} />
                <span className="tip">Copied</span>
              </IconButton>
            </span>
          )}
        </div>
      </div>

      <div className="row__pw">
        <span className={`row__pwval ${revealed ? "is-on" : ""}`.trim()}>
          {revealed ? password : MASK}
        </span>
        <IconButton
          aria-label={revealed ? "Hide password" : "Reveal password"}
          aria-pressed={revealed}
          onClick={() => setRevealed((r) => !r)}
        >
          <Icon name={revealed ? "eyeOff" : "eye"} size={15} />
        </IconButton>
        <IconButton
          className={copied === "password" ? "is-copied" : ""}
          aria-label="Copy password"
          onClick={() => copy(password, "password")}
        >
          <Icon name={copied === "password" ? "check" : "copy"} size={14} />
          <span className="tip">Copied</span>
        </IconButton>
      </div>

      <div className="row__divider" aria-hidden="true" />

      <div className="row__acts">
        <IconButton size="lg" aria-label="Edit" onClick={() => onEdit(item)}>
          <Icon name="pen" size={15} />
        </IconButton>
        <IconButton size="lg" tone="danger" aria-label="Delete" onClick={() => onDelete(item)}>
          <Icon name="trash" size={15} />
        </IconButton>
      </div>
    </Card>
  );
}
