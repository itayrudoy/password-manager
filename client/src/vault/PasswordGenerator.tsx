import { useState } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { generatePassword, type GeneratorOptions } from "../lib/passwordGenerator";
import "./PasswordGenerator.css";

const MIN_LENGTH = 8;
const MAX_LENGTH = 40;

const DEFAULT_OPTIONS: GeneratorOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
};

/** Character-set toggles, in display order: [option key, glyph, a11y label]. */
const SETS: ReadonlyArray<[keyof GeneratorOptions, string, string]> = [
  ["lowercase", "a–z", "Include lowercase letters"],
  ["uppercase", "A–Z", "Include uppercase letters"],
  ["digits", "0–9", "Include digits"],
  ["symbols", "!@#", "Include symbols"],
];

interface PasswordGeneratorProps {
  onGenerate: (password: string) => void;
}

/** A labeled "Generate password" trigger that reveals a collapsible options
 *  panel (length + character sets). Opening the panel only shows the options —
 *  a password is produced solely when Generate is clicked. Self-contained: it
 *  owns its open/options state and hands finished passwords to the parent. */
export function PasswordGenerator({ onGenerate }: PasswordGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_OPTIONS);

  const selectedCount = SETS.filter(([key]) => options[key]).length;

  function toggleSet(key: keyof GeneratorOptions) {
    // Never let the user disable the last remaining character set.
    if (options[key] && selectedCount === 1) return;
    setOptions((o) => ({ ...o, [key]: !o[key] }));
  }

  function generate() {
    const pw = generatePassword(options);
    if (pw) onGenerate(pw);
  }

  return (
    <div className="pwgen">
      <button
        type="button"
        className="pwgen__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="refresh" size={15} />
        Generate password
        <Icon name="chevronDown" size={14} className="pwgen__chev" />
      </button>

      {open && (
        <div className="pwgen__panel" role="group" aria-label="Generator options">
          <div className="pwgen__row">
            <span className="pwgen__label">Length</span>
            <input
              type="range"
              className="pwgen__range"
              min={MIN_LENGTH}
              max={MAX_LENGTH}
              value={options.length}
              aria-label="Password length"
              onChange={(e) =>
                setOptions((o) => ({ ...o, length: Number(e.target.value) }))
              }
            />
            <span className="pwgen__len">{options.length}</span>
          </div>

          <div className="pwgen__row pwgen__row--sets">
            {SETS.map(([key, glyph, label]) => (
              <button
                key={key}
                type="button"
                className="pwgen__opt"
                aria-pressed={options[key] as boolean}
                aria-label={label}
                onClick={() => toggleSet(key)}
              >
                {glyph}
              </button>
            ))}
            <Button variant="primary" className="pwgen__go" onClick={generate}>
              <Icon name="refresh" size={13} />
              Generate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
