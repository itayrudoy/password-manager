/* The Strongroom row logo is a colored tile with a white mono initial. The
   mockup hand-picks a brand color per item; for real vault data we derive a
   stable color from the title so every item keeps the same tile color. */
export function logoColor(title: string): string {
  const name = title.trim();
  if (!name) return "#4b5751"; // muted fallback (matches the mockup's default)

  let hue = 0;
  for (let i = 0; i < name.length; i++) {
    hue = (hue * 31 + name.charCodeAt(i)) % 360;
  }
  // Mid-dark, moderately saturated — reads with white text in both themes.
  return `hsl(${hue} 42% 42%)`;
}
