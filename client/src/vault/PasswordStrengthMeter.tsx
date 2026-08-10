import { estimateStrength } from "../lib/passwordStrength";
import "./PasswordStrengthMeter.css";

const BARS = 12;

/** Tone name per strength score (index 0 = empty, 1–4 = Weak→Strong). Drives
 *  both bar and label color in CSS. */
const TONE = ["empty", "weak", "fair", "good", "strong"] as const;

interface PasswordStrengthMeterProps {
  password: string;
}

/** A compact strength read-out — a row of bars that fill in proportion to the
 *  estimated entropy and color by tier, plus a mono label. Echoes the vault
 *  "barcode" motif from the Strongroom mockup. Purely derived from `password`. */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { bits, score, label } = estimateStrength(password);
  // Fill scales with entropy (≈100 bits fills the row), always showing at least
  // one bar for a non-empty value.
  const filled = password
    ? Math.max(1, Math.min(BARS, Math.round((bits / 100) * BARS)))
    : 0;
  const tone = password ? TONE[score] : "empty";

  return (
    <div className="strength" data-tone={tone} aria-live="polite">
      <div className="strength__bars" aria-hidden="true">
        {Array.from({ length: BARS }, (_, i) => (
          <span key={i} className={i < filled ? "is-on" : ""} />
        ))}
      </div>
      <span className="strength__tag">{password ? label : "—"}</span>
    </div>
  );
}
