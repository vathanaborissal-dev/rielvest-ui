/**
 * Reading themed values out of CSS for canvas-based charts.
 *
 * Two separate problems have to be solved to get a usable colour string:
 *
 *  1. `getComputedStyle(el).getPropertyValue('--x')` returns a custom property
 *     as an unresolved token stream. Applying the variable to an element and
 *     reading back a *standard* property forces the browser to resolve it.
 *
 *  2. The resolved value is not necessarily legacy syntax. Chrome serialises a
 *     `color-mix()` result as `color(srgb 0.656 0.656 0.656)`, which chart
 *     libraries that predate CSS Color 4 cannot parse.
 *
 * So the resolved value is pushed through a 1x1 canvas, whose `getImageData`
 * always returns plain 8-bit RGBA whatever colour space the input used. That
 * handles every current and future colour syntax the browser accepts, without
 * this file needing to know any of them.
 */

let scratchContext: CanvasRenderingContext2D | null | undefined;

function getScratchContext(): CanvasRenderingContext2D | null {
  if (scratchContext !== undefined) return scratchContext;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  scratchContext = canvas.getContext("2d", { willReadFrequently: true });
  return scratchContext;
}

/** Converts any CSS colour the browser understands into `rgb()` / `rgba()`. */
export function toLegacyRgb(cssColor: string, fallback: string): string {
  const context = getScratchContext();
  if (!context || !cssColor) return fallback;

  try {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = cssColor;
    context.fillRect(0, 0, 1, 1);
    // getImageData returns non-premultiplied RGBA, so the components are the
    // colour itself even when it carries alpha.
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    if (r === undefined || g === undefined || b === undefined || a === undefined) return fallback;
    if (a === 0) return fallback;
    return a === 255
      ? `rgb(${r}, ${g}, ${b})`
      : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  } catch {
    return fallback;
  }
}

/** Resolves CSS custom properties to concrete `rgb()` colours in one reflow. */
export function resolveThemeColors<K extends string>(
  tokens: Record<K, { token: string; fallback: string }>,
): Record<K, string> {
  const entries = Object.entries(tokens) as [K, { token: string; fallback: string }][];

  if (typeof document === "undefined") {
    return Object.fromEntries(entries.map(([key, spec]) => [key, spec.fallback])) as Record<K, string>;
  }

  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0";
  document.body.appendChild(probe);

  const resolved = {} as Record<K, string>;
  for (const [key, spec] of entries) {
    probe.style.color = "";
    probe.style.color = `var(${spec.token})`;
    resolved[key] = toLegacyRgb(getComputedStyle(probe).color, spec.fallback);
  }

  probe.remove();
  return resolved;
}

/** Resolves a font-family custom property to a concrete stack. */
export function resolveThemeFont(token: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "position:absolute;opacity:0;pointer-events:none;width:0;height:0";
  probe.style.fontFamily = `var(${token})`;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).fontFamily;
  probe.remove();
  return value || fallback;
}

/**
 * Applies an alpha to an already-resolved colour.
 *
 * Concatenating a two-digit hex alpha onto a colour string only works when the
 * colour happens to be hex. Once values are resolved through the browser they
 * come back as `rgb()`, so the alpha has to be applied structurally.
 */
export function withAlpha(rgbColor: string, alpha: number): string {
  const match = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(rgbColor);
  if (!match) return rgbColor;
  const [, r, g, b] = match;
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha)).toFixed(3)})`;
}
