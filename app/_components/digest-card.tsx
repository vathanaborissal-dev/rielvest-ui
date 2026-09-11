import Link from "next/link";
import { DecisionReview } from "./decision-review";
import { SafeText } from "./data-ui";
import { SessionCountdown } from "./session-countdown";
import { StockAvatar } from "./stock-avatar";
import { formatCompact, formatNumber, formatPercent, movementClass } from "../_lib/format";
import type {
  DigestBoardRow,
  DigestCandidate,
  DigestMover,
  DigestNewsItem,
  MarketDigest,
  OrderTicket,
} from "../_lib/types";

/**
 * The answer, before the evidence.
 *
 * Reading order matches the order a returning reader asks: what happened, who
 * said something, which prices are worth thinking about — then the whole
 * tradeable board so the shortlist is never mistaken for the whole market.
 * Everything that *justifies* those answers stays collapsed below.
 */
export function DigestCard({ digest }: { digest: MarketDigest }) {
  const { pulse, universe, freshness } = digest;

  return (
    <section className="digest" aria-label="Today in brief">
      <header className="digest-head">
        <div>
          <p className="digest-kicker">
            <SafeText>{freshness.kicker}</SafeText>
          </p>
          <p className="digest-market">
            <SafeText>{digest.headline.market}</SafeText>
          </p>
          {/* Stated whenever the figures are not from a completed session today,
              so a Monday-morning reader is never shown Friday as "today". */}
          {freshness.staleNote ? (
            <p className="digest-stale">
              <SafeText>{freshness.staleNote}</SafeText>
            </p>
          ) : null}
        </div>
        <span className="digest-status" data-open={digest.marketOpen}>
          {digest.marketOpen ? "Open" : "Closed"}
        </span>
      </header>

      {/* What the exchange is doing to an order right now. During the
          pre-opening auction this is the most time-sensitive thing on the page. */}
      <div className="session-strip" data-accepting={digest.session.acceptsOrders}>
        <div className="session-strip-head">
          <strong><SafeText>{digest.session.label}</SafeText></strong>
          <SessionCountdown session={digest.session} />
        </div>
        <ul>
          {digest.session.guidance.map((line) => (
            <li key={line}><SafeText>{line}</SafeText></li>
          ))}
        </ul>
      </div>

      {pulse.lines.length > 0 ? (
        <ul className="digest-pulse">
          {pulse.lines.map((line) => (
            <li key={line}>
              <SafeText>{line}</SafeText>
            </li>
          ))}
        </ul>
      ) : null}

      {digest.movers.length > 0 ? (
        <>
          <p className="digest-label">Biggest moves worth trading</p>
          <ul className="digest-movers">
            {digest.movers.map((mover) => (
              <MoverChip key={mover.symbol} mover={mover} />
            ))}
          </ul>
        </>
      ) : null}

      <p className="digest-label">
        Disclosed this week
        {digest.news.length === 0 ? <span className="digest-quiet"> — nothing</span> : null}
      </p>
      {digest.news.length > 0 ? (
        <ul className="digest-newsfeed">
          {digest.news.slice(0, 5).map((item) => (
            <NewsRow key={`${item.symbol ?? ""}-${item.title}`} item={item} />
          ))}
        </ul>
      ) : null}

      {digest.candidates.length === 0 ? (
        <p className="digest-empty">
          <SafeText>{digest.emptyReason ?? "Nothing is near a level that has held before."}</SafeText>
        </p>
      ) : (
        <>
          <p className="digest-label">Closest to a price that has mattered before</p>
          <ol className="digest-list">
            {digest.candidates.map((candidate) => (
              <CandidateRow key={candidate.symbol} candidate={candidate} />
            ))}
          </ol>
        </>
      )}

      {digest.board.length > 0 ? (
        <details className="digest-board-wrap">
          <summary>
            All {universe.tradeable} tradeable stocks
            <span className="digest-quiet">
              {" "}
              · {universe.assessed - universe.tradeable} excluded as too thin
            </span>
          </summary>
          <div className="digest-board-scroll">
            <table className="digest-board">
              <thead>
                <tr>
                  <th scope="col">Stock</th>
                  <th scope="col">Price</th>
                  <th scope="col">Chg</th>
                  <th scope="col">Riel/day</th>
                  <th scope="col">RSI</th>
                  <th scope="col">State</th>
                  <th scope="col">Nearest level</th>
                </tr>
              </thead>
              <tbody>
                {digest.board.map((row) => (
                  <BoardRow key={row.symbol} row={row} />
                ))}
              </tbody>
            </table>
          </div>
          {universe.excluded.length > 0 ? (
            <p className="digest-excluded">
              Left out for trading under {formatCompact(universe.floorKhr)} riel a day:{" "}
              {universe.excluded.join(", ")}. At that turnover a{" "}
              {formatCompact(universe.referencePositionKhr)} riel position would be more than{" "}
              {Math.round(universe.maxShareOfTurnover * 100)}% of a normal day&rsquo;s volume, so
              getting in or out would move the price itself.
            </p>
          ) : null}
        </details>
      ) : null}

      <details className="digest-method">
        <summary>How this shortlist was chosen</summary>
        <p>
          <SafeText>{digest.criteria}</SafeText>
        </p>
        {digest.candidates.length > 0 ? (
          <ul>
            {digest.candidates.map((candidate) => (
              <li key={candidate.symbol}>
                <strong>{candidate.symbol}</strong>
                <span>
                  {candidate.scoreParts
                    .map((part) => `${part.label} (${part.points > 0 ? "+" : ""}${part.points})`)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="digest-caution">
          <SafeText>{digest.caution}</SafeText>
        </p>
      </details>
    </section>
  );
}

function MoverChip({ mover }: { mover: DigestMover }) {
  return (
    <li className="digest-mover">
      <Link href={`/stocks/${mover.symbol}`}>
        <StockAvatar symbol={mover.symbol} size={24} />
        <strong>{mover.symbol}</strong>
        <em className={movementClass(mover.changePercent)}>{formatPercent(mover.changePercent)}</em>
      </Link>
      {mover.note ? <small><SafeText>{mover.note}</SafeText></small> : null}
    </li>
  );
}

function NewsRow({ item }: { item: DigestNewsItem }) {
  const body = (
    <>
      {item.symbol ? (
        <span className="digest-news-sym" data-tradeable={item.tradeable}>
          {item.symbol}
        </span>
      ) : null}
      {item.sinceLastSession ? <span className="digest-news-new">Not yet priced</span> : null}
      <span className="digest-news-title">
        <SafeText>{item.title}</SafeText>
      </span>
      <time dateTime={item.date}>{item.date}</time>
    </>
  );

  return (
    <li className="digest-news-row">
      {item.url ? (
        <a href={item.url} target="_blank" rel="noreferrer noopener">
          {body}
        </a>
      ) : (
        body
      )}
    </li>
  );
}

function TicketCell({ ticket, side }: { ticket: OrderTicket | null; side: "buy" | "sell" }) {
  if (!ticket) return (
    <div className="ticket" data-side={side} data-reachable="false">
      <span className="ticket-side">{side === "buy" ? "Buy reference" : "Sell reference"}</span>
      <strong>No nearby reference</strong>
      <small>Recent movement does not support a tick-valid reference price.</small>
    </div>
  );

  if (!ticket.reachableToday) {
    return (
      <div className="ticket" data-side={ticket.side} data-reachable="false">
        <span className="ticket-side">{ticket.side === "buy" ? "Buy" : "Sell"}</span>
        <strong>Out of reach today</strong>
        <small><SafeText>{ticket.unreachableNote ?? ""}</SafeText></small>
      </div>
    );
  }

  return (
    <div className="ticket" data-side={ticket.side} data-reachable="true">
      <span className="ticket-side">{ticket.side === "buy" ? "Buy limit reference" : "Sell limit reference"}</span>
      <strong>{formatNumber(ticket.limitPrice)}</strong>
      <small>{ticket.label.toLowerCase()}</small>
      {ticket.distanceKhr !== undefined ? (
        <small>{ticket.distanceKhr > 0 ? "+" : "−"}{formatNumber(Math.abs(ticket.distanceKhr))} KHR from close</small>
      ) : null}
      <details className="ticket-detail">
        <summary>Basis and size</summary>
        {ticket.typicalRangeKhr !== undefined ? <small>Recent daily range: {formatNumber(ticket.typicalRangeKhr)} KHR (20-session median true range).</small> : null}
        {ticket.referenceBasis ? <small>{ticket.referenceBasis}</small> : null}
        <small>Reference scenario only. Check the live bid and ask; an order may not fill.</small>
        {ticket.shares !== null ? <small>Turnover-based size ceiling: {formatCompact(ticket.shares)} shares{ticket.valueKhr !== null ? ` · ${formatCompact(ticket.valueKhr)} KHR total` : ""}. Your budget may be smaller.</small> : null}
        {ticket.settlesOn ? <small>Settles {ticket.settlesOn}</small> : null}
      </details>
    </div>
  );
}

function BoardRow({ row }: { row: DigestBoardRow }) {
  return (
    <tr>
      <th scope="row">
        <Link href={`/stocks/${row.symbol}`}>
          <StockAvatar symbol={row.symbol} size={22} />
          <span>
            <strong>{row.symbol}</strong>
            {row.hasNews ? <span className="digest-news-dot" title="Disclosed this week" /> : null}
          </span>
        </Link>
      </th>
      <td>{formatNumber(row.price)}</td>
      <td className={movementClass(row.changePercent)}>{formatPercent(row.changePercent)}</td>
      <td>{formatCompact(row.turnoverKhr)}</td>
      <td>{row.rsi ?? "—"}</td>
      <td>
        <span className="digest-state" data-state={row.state.toLowerCase().replace(/\s+/g, "-")}>
          {row.state}
        </span>
      </td>
      <td>
        {row.levelLabel !== null && row.levelPrice !== null ? (
          <>
            {formatNumber(row.levelPrice)}
            <small>
              {" "}
              {row.levelLabel.toLowerCase()}
              {row.distancePercent !== null ? ` · ${row.distancePercent}% away` : ""}
            </small>
          </>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

function CandidateRow({ candidate }: { candidate: DigestCandidate }) {
  return (
    <li className="digest-row">
      <Link className="digest-name" href={`/stocks/${candidate.symbol}`}>
        <StockAvatar symbol={candidate.symbol} size={32} />
        <span>
          <strong>{candidate.symbol}</strong>
          <small>{candidate.name}</small>
        </span>
      </Link>

      <div className="digest-price">
        <strong>{formatNumber(candidate.price)}</strong>
        <em className={movementClass(candidate.changePercent)}>
          {formatPercent(candidate.changePercent)}
        </em>
      </div>

      <div className="digest-level" data-side={candidate.levelSide}>
        <span>
          {candidate.levelSide === "support" ? "Holding above" : "Capped by"}{" "}
          {candidate.levelLabel.toLowerCase()}
        </span>
        <strong>{formatNumber(candidate.levelPrice)}</strong>
        {candidate.otherPrice !== null ? (
          <small>
            Historical {candidate.otherLabel?.toLowerCase()}: {formatNumber(candidate.otherPrice)}
          </small>
        ) : null}
      </div>

      <div className="digest-notes">
        {candidate.reasons.slice(0, 2).map((reason) => (
          <p key={reason} className="digest-reason">
            <SafeText>{reason}</SafeText>
          </p>
        ))}
        {candidate.cautions.map((caution) => (
          <p key={caution} className="digest-caution-line">
            <SafeText>{caution}</SafeText>
          </p>
        ))}
        <p className="digest-constraints">
          Band {formatNumber(candidate.limitDown)}–{formatNumber(candidate.limitUp)} · tick{" "}
          {candidate.tickSize}
        </p>

        {/* Nearby scenarios, constrained by observed movement and exchange rules. */}
        <div className="ticket-row">
          <TicketCell ticket={candidate.tickets.buy} side="buy" />
          <TicketCell ticket={candidate.tickets.sell} side="sell" />
        </div>
      </div>
      <DecisionReview symbol={candidate.symbol} />
    </li>
  );
}
