"use client";

import { useState } from "react";
import { logoFor } from "../_lib/logos";

/**
 * A company's mark, falling back to its ticker initials.
 *
 * The ticker is never removed from the surrounding interface: on an exchange
 * you identify, search and place orders by ticker, so the logo is the picture
 * beside the name rather than a replacement for it. The fallback also runs when
 * an image fails to load, so a broken file degrades instead of leaving a hole.
 */
export function StockAvatar({
  symbol,
  size = 34,
  className,
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  const source = logoFor(symbol);
  const [failed, setFailed] = useState(false);
  const showImage = source !== null && !failed;

  return (
    <span
      className={`stock-avatar${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
      data-has-logo={showImage}
      aria-hidden="true"
    >
      {showImage ? (
        // Plain <img>: these are a handful of small local files of mixed
        // format (including an .ico), which next/image cannot optimise anyway.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={source} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="stock-avatar-initials">{symbol.slice(0, 2)}</span>
      )}
    </span>
  );
}
