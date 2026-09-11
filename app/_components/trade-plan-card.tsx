"use client";

import { useState } from "react";
import { SafeText } from "./data-ui";
import { formatCompact, formatDate, formatNumber, formatPercent } from "../_lib/format";
import type { TradePlan } from "../_lib/types";

/**
 * "What prices matter for this stock today."
 *
 * Laid out as a ladder because that is how the prices relate to each other:
 * resistance above, the last trade in the middle, support and the level that
 * would invalidate it below. Reading down the column is reading the decision.
 */
export function TradePlanCard({ plan }: { plan: TradePlan }) {
  // Prices first, reasoning on request. The numbers are what a reader opened
  // the page for; burying them under two lines of explanation each is what
  // made the card feel like an essay.
  const [verbose, setVerbose] = useState(false);

  if (plan.zones.length === 0 || plan.lastPrice === null) {
    return (
      <section className="plan-card">
        <header>
          <h2>Today&rsquo;s price levels</h2>
        </header>
        <p className="plan-empty">
          <SafeText>{plan.summary[0] ?? "Not enough recorded sessions to identify levels."}</SafeText>
        </p>
      </section>
    );
  }

  // Highest first, so the ladder reads the way a price chart does.
  const ladder = [...plan.zones].sort((a, b) => b.from - a.from);
  const lastPrice = plan.lastPrice;
  const inserted = ladder.findIndex((zone) => zone.from < lastPrice);
  const splitAt = inserted === -1 ? ladder.length : inserted;

  return (
    <section className="plan-card">
      <header>
        <div>
          <h2>Today&rsquo;s price levels</h2>
          <p>{plan.asOf ? `From the ${formatDate(plan.asOf)} session.` : "From the latest session."}</p>
        </div>
        <div className="plan-head-right">
          {plan.dailyRange ? (
            <div className="plan-range">
              <span>Typical day</span>
              <strong>±{formatNumber(plan.dailyRange.khr)} KHR</strong>
              <em>{formatNumber(plan.dailyRange.percent, 1)}%</em>
            </div>
          ) : null}
          <button
            type="button"
            className="plan-explain-toggle"
            onClick={() => setVerbose((value) => !value)}
            aria-expanded={verbose}
          >
            {verbose ? "Hide why" : "Why these prices?"}
          </button>
        </div>
      </header>

      <ol className="plan-ladder">
        {ladder.slice(0, splitAt).map((zone) => (
          <PlanRow key={zone.label} zone={zone} verbose={verbose} />
        ))}

        <li className="plan-row plan-row-last">
          <span className="plan-price">{formatNumber(lastPrice)}</span>
          <span className="plan-body">
            <strong>Last traded</strong>
            {verbose ? <span>The base price today&rsquo;s limits are measured from.</span> : null}
          </span>
          <span className="plan-distance">—</span>
        </li>

        {ladder.slice(splitAt).map((zone) => (
          <PlanRow key={zone.label} zone={zone} verbose={verbose} />
        ))}
      </ol>

      {plan.rules ? (
        <dl className="plan-rules">
          <div>
            <dt>Today&rsquo;s limits</dt>
            <dd>
              {formatNumber(plan.rules.limitDown)} – {formatNumber(plan.rules.limitUp)}
            </dd>
            {verbose ? <span>No order matches outside this range</span> : null}
          </div>
          <div>
            <dt>Tick size</dt>
            <dd>{plan.rules.tickSize} KHR</dd>
            {verbose ? <span>Your limit price must be a multiple</span> : null}
          </div>
          <div>
            <dt>Workable size</dt>
            <dd>
              {plan.rules.workableShares !== null
                ? `~${formatCompact(plan.rules.workableShares)} shares`
                : "Not available"}
            </dd>
            {verbose ? <span>10% of a typical session&rsquo;s turnover</span> : null}
          </div>
          <div>
            <dt>Settles</dt>
            <dd>{formatDate(plan.rules.settlementDate)}</dd>
            {verbose ? <span>T+2 business days</span> : null}
          </div>
        </dl>
      ) : null}

      {plan.caveats.length > 0 ? (
        <ul className="plan-caveats">
          {plan.caveats.map((caveat) => (
            <li key={caveat}>
              <SafeText>{caveat}</SafeText>
            </li>
          ))}
        </ul>
      ) : null}

      {verbose ? (
        <p className="plan-caution">
          <SafeText>{plan.caution}</SafeText>
        </p>
      ) : (
        <p className="plan-caution">Reference levels, not advice.</p>
      )}
    </section>
  );
}

function PlanRow({ zone, verbose }: { zone: TradePlan["zones"][number]; verbose: boolean }) {
  return (
    <li className="plan-row" data-tone={zone.tone}>
      <span className="plan-price">
        {formatNumber(zone.from)}
        {zone.to ? <em>– {formatNumber(zone.to)}</em> : null}
      </span>
      <span className="plan-body">
        <strong>{zone.label}</strong>
        {verbose ? (
          <>
            <span>
              <SafeText>{zone.meaning}</SafeText>
            </span>
            <small>
              <SafeText>{zone.basis}</SafeText>
            </small>
          </>
        ) : null}
      </span>
      <span className="plan-distance" data-direction={zone.distancePercent > 0 ? "up" : "down"}>
        {formatPercent(zone.distancePercent)}
      </span>
    </li>
  );
}
