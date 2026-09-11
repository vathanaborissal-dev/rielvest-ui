"use client";

import { useEffect, useState } from "react";
import type { DigestSession } from "../_lib/types";

/**
 * The clock the 08:00 reader is actually working against.
 *
 * The page is server-rendered, so a minute count baked in at render time is
 * wrong by the time anyone acts on it — and during the pre-opening auction
 * that is exactly the number being relied on. This recomputes from the event's
 * ISO instant instead, so a tab left open since 08:05 still tells the truth.
 */
export function SessionCountdown({ session }: { session: DigestSession }) {
  const target = session.nextEvent ? Date.parse(session.nextEvent.at) : null;
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (target === null) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 20_000);
    return () => clearInterval(timer);
  }, [target]);

  if (!session.nextEvent) return null;

  // Before hydration, fall back to the figure the server computed rather than
  // rendering nothing or a number that disagrees with the markup.
  const minutes =
    now === null || target === null
      ? session.nextEvent.minutesAway
      : Math.max(0, Math.round((target - now) / 60_000));

  return (
    <span className="session-countdown" data-urgent={minutes <= 15 && session.acceptsOrders}>
      {session.nextEvent.label} {minutes <= 0 ? "now" : `in ${formatGap(minutes)}`}
    </span>
  );
}

function formatGap(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
  const days = Math.round(hours / 24);
  return days === 1 ? "a day" : `${days} days`;
}
