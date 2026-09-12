import Link from "next/link";
import { AppShell, PageHeader } from "../_components/app-shell";
import { AssessmentTag, DataNotice, SafeText, SourceFooter } from "../_components/data-ui";
import { ContextPanel } from "../_components/context-panel";
import { DigestCard } from "../_components/digest-card";
import { getBriefing, getDigest, getMarketContext } from "../_lib/api";
import { formatCompact, formatDate, formatNumber, formatPercent, movementClass } from "../_lib/format";
import type { BriefingSignal, SignalKind } from "../_lib/types";

export const dynamic = "force-dynamic";

/** Short labels so a reader can tell signal types apart without reading them. */
const KIND_LABEL: Record<SignalKind, string> = {
  limit_move: "Price limit",
  big_move: "Large move",
  dividend_upcoming: "Record date",
  dividend_declared: "Dividend",
  earnings_report: "Results filed",
  disclosure: "Disclosure",
  breakout: "Breakout",
  breakdown: "Breakdown",
  at_resistance: "At resistance",
  at_support: "At support",
  volume_surge: "Volume",
  overbought: "Stretched",
  oversold: "Oversold",
  range_high: "52-week high",
  range_low: "52-week low",
  illiquid: "Thin trading",
  gap: "Gap",
};

function FocusCard({ signal }: { signal: BriefingSignal }) {
  const constraints = signal.constraints;

  return (
    <article className="brief-card" data-assessment={signal.assessment}>
      <header>
        <div className="brief-card-id">
          <span className="brief-rank" aria-label={`Priority ${signal.priority}`}>
            {signal.priority}
          </span>
          <Link href={`/stocks/${signal.symbol}`} className="brief-symbol">
            {signal.symbol}
          </Link>
          <span className="brief-kind">{KIND_LABEL[signal.kind]}</span>
        </div>
        <AssessmentTag value={signal.assessment} />
      </header>

      <h3>
        <SafeText>{signal.headline}</SafeText>
      </h3>
      <details className="brief-why">
        <summary>Why this matters</summary>
        <p>
          <SafeText>{signal.detail}</SafeText>
        </p>
      </details>

      <ul className="brief-evidence">
        {signal.evidence.map((item) => (
          <li key={item.label} data-provenance={item.provenance}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>

      {/* `open` by default: the prices are the reason to read the card, and a
          reader should not have to find them behind a disclosure. */}
      {constraints ? (
        <details className="brief-prices" open>
          <summary>
            Prices for today
            <span>
              band {formatNumber(constraints.limitDown)}–{formatNumber(constraints.limitUp)} · tick{" "}
              {constraints.tickSize}
            </span>
          </summary>

          <table>
            <caption className="sr-only">
              Reference prices for {signal.symbol}, already rounded to a valid tick
            </caption>
            <colgroup>
              <col className="price" />
              <col className="distance" />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Price</th>
                <th scope="col">From close</th>
                <th scope="col">What it is</th>
              </tr>
            </thead>
            <tbody>
              {constraints.keyPrices.map((price) => (
                <tr key={price.label}>
                  <td className="numeric">{formatNumber(price.price)}</td>
                  <td className={`numeric ${movementClass(price.distancePercent)}`}>
                    {formatPercent(price.distancePercent)}
                  </td>
                  <td>
                    <strong>{price.label}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="brief-liquidity">
            ~{formatCompact(constraints.comfortableShares ?? 0)} shares workable · settles{" "}
            {formatDate(constraints.settlementDate)}
          </p>
        </details>
      ) : null}

      {signal.sourceUrl ? (
        <a className="brief-source" href={signal.sourceUrl} target="_blank" rel="noreferrer">
          Read the filing on csx.com.kh
        </a>
      ) : null}
    </article>
  );
}

export default async function BriefingPage() {
  const [result, digestResult, contextResult] = await Promise.all([
    getBriefing(),
    getDigest(),
    getMarketContext(),
  ]);
  const brief = result.data;
  const digest = digestResult.data;
  const context = contextResult.data;

  if (!brief) {
    return (
      <AppShell active="briefing">
        <PageHeader
          eyebrow="Before the bell"
          title="Today's brief"
          description="What needs a decision before the market opens."
        />
        <DataNotice title="The brief could not be generated">
          {result.error} Nothing is shown rather than a partial brief, because a missing signal is
          worse than an obvious gap.
        </DataNotice>
      </AppShell>
    );
  }

  const rest = brief.signals.slice(brief.focus.length);

  return (
    <AppShell active="briefing">
      <PageHeader
        eyebrow={digest?.freshness.eyebrow ?? "Today's market"}
        title="Today's brief"
        description="What happened, what was disclosed, and which prices are worth a look."
        meta={
          <div className="session-meta">
            <span>{brief.status.acceptsOrders ? "Accepting orders" : "Market closed"}</span>
            <strong>{formatDate(brief.asOf)}</strong>
          </div>
        }
      />

      {digest ? <DigestCard digest={digest} /> : null}
      {context ? <ContextPanel context={context} /> : null}

      {/* Everything below is the evidence behind the card above. It is
          collapsed because a reader checking in briefly has already had their
          answer, and one who wants the workings can ask for it. */}
      <details className="brief-detail-block">
        <summary>
          <span>Full brief</span>
          <small>
            market pulse, every signal, and the {brief.quiet.length} stocks with nothing notable
          </small>
        </summary>

      <p className="brief-status" data-open={brief.status.acceptsOrders}>
        <SafeText>{brief.status.label}</SafeText>
      </p>

      <section className="brief-headline" aria-label="Summary">
        {brief.headline.map((line) => (
          <p key={line}>
            <SafeText>{line}</SafeText>
          </p>
        ))}
      </section>

      <section className="brief-pulse" aria-label="Market pulse">
        <div>
          <span>CSX index</span>
          <strong>
            {brief.pulse.indexValue !== null ? formatNumber(brief.pulse.indexValue, 2) : "—"}
          </strong>
          <em className={movementClass(brief.pulse.indexChangePercent)}>
            {formatPercent(brief.pulse.indexChangePercent)}
          </em>
        </div>
        <div>
          <span>Advance / decline</span>
          <strong>
            {brief.pulse.advancing} / {brief.pulse.declining}
          </strong>
          <em>{brief.pulse.unchanged} unchanged</em>
        </div>
        <div>
          <span>Turnover</span>
          <strong>{formatCompact(brief.pulse.turnover)} KHR</strong>
          <em>
            {brief.pulse.turnoverRatio !== null
              ? `${formatNumber(brief.pulse.turnoverRatio, 1)}x recent average`
              : "no comparison available"}
          </em>
        </div>
        <div>
          <span>Concentration</span>
          <strong>
            {brief.pulse.concentrationPercent !== null
              ? `${Math.round(brief.pulse.concentrationPercent)}%`
              : "—"}
          </strong>
          <em>{brief.pulse.concentrationSymbol ?? "—"} took the most turnover</em>
        </div>
      </section>

      <p className="brief-breadth">
        <SafeText>{brief.pulse.breadthNote}</SafeText>
      </p>

      {brief.focus.length > 0 ? (
        <>
          <div className="section-heading-row">
            <div>
              <h2>Needs attention</h2>
              <p>Ranked by how much each one constrains a decision today.</p>
            </div>
          </div>
          <div className="brief-grid">
            {brief.focus.map((signal) => (
              <FocusCard key={`${signal.symbol}-${signal.kind}`} signal={signal} />
            ))}
          </div>
        </>
      ) : (
        <DataNotice title="Nothing is at a decision point">
          No issuer has disclosed anything this week, and no stock is sitting on a level it has
          previously respected.
        </DataNotice>
      )}

      {rest.length > 0 ? (
        <>
          <div className="section-heading-row">
            <div>
              <h2>Also worth noting</h2>
              <p>Context rather than a call to act.</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Secondary signals</caption>
              <thead>
                <tr>
                  <th scope="col">Stock</th>
                  <th scope="col">Type</th>
                  <th scope="col">What happened</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((signal) => (
                  <tr key={`${signal.symbol}-${signal.kind}`}>
                    <th scope="row">
                      <Link href={`/stocks/${signal.symbol}`}>{signal.symbol}</Link>
                    </th>
                    <td>
                      <span className="brief-kind">{KIND_LABEL[signal.kind]}</span>
                    </td>
                    <td>
                      <SafeText>{signal.headline}</SafeText>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {brief.quiet.length > 0 ? (
        <p className="brief-quiet">
          Nothing notable on {brief.quiet.join(", ")}. They are listed so you know they were checked,
          not overlooked.
        </p>
      ) : null}

      <p className="brief-caution">
        <SafeText>{brief.caution}</SafeText>
      </p>
      </details>

      <SourceFooter asOf={brief.asOf} />
    </AppShell>
  );
}
