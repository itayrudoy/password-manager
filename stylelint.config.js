/**
 * Stylelint — design-system token discipline.
 *
 * The strict-value rule enforces PM-4's DoD mechanically: foundational-tier
 * properties (color, background, radii, type) in the shared UI primitives must
 * reference a design token (a `var(--…)`) rather than a raw literal. Raw values
 * live only in tokens.css.
 *
 * Scope note: enforced on the shared primitive layer (client/src/ui) — the
 * shared vocabulary. Feature CSS (vault/, auth/) still carries px/hex literals
 * from the earlier redesign and is intentionally out of scope here; tokenizing
 * it is tracked as follow-up work, not part of PM-4.
 */
export default {
  // Base has no rules — feature CSS is scanned but unconstrained (see scope note).
  rules: {},
  overrides: [
    {
      files: ["client/src/ui/**/*.css"],
      plugins: ["stylelint-declaration-strict-value"],
      rules: {
        "scale-unlimited/declaration-strict-value": [
          ["/color/", "background", "fill", "stroke", "border-radius", "font-size"],
          {
            ignoreValues: ["transparent", "currentColor", "inherit", "none"],
            // color-mix(), etc. are allowed — they compose tokens.
            ignoreFunctions: true,
          },
        ],
      },
    },
  ],
};
