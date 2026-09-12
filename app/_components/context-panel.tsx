import { SafeText } from "./data-ui";
import { formatNumber, formatPercent, movementClass } from "../_lib/format";
import type { LiveQuote, MarketContext } from "../_lib/types";

/**
 * What moved while Phnom Penh was shut.
 *
 * CSX is closed for eighteen hours out of every twenty-four, and a pre-opening
 * order at 08:00 is priced across that gap. Nothing in RielVest's own data
 * speaks to it, so this panel borrows from elsewhere — and says so plainly,
 * because the whole product rests on the reader knowing which numbers RielVest
 * measured and which it is passing through.
 */
export function ContextPanel({ context }: { context: MarketContext }) {
  const regionAvailable = context.region.filter((quote) => quote.available);

  return (
    <details className="context-panel">
      <summary>
        <span className="context-kicker">While the market was shut</span>
        <span className="context-summary">
          {context.summary ? (
            <SafeText>{context.summary}</SafeText>
          ) : (
            "Regional figures could not be read right now."
          )}
        </span>
      </summary>

      <div className="context-body">
        {regionAvailable.length > 0 ? (
          <>
            <p className="context-label">Regional markets</p>
            <ul className="context-grid">
              {context.region.map((quote) => (
                <QuoteCell key={quote.key} quote={quote} />
              ))}
            </ul>
          </>
        ) : null}

        <p className="context-label">Gold and the dollar</p>
        <ul className="context-grid">
          {context.benchmarks.map((quote) => (
            <QuoteCell key={quote.key} quote={quote} />
          ))}
        </ul>

        <p className="context-label">Cambodian market news</p>
        {context.headlines.length > 0 ? (
          <>
            <ul className="context-news">
              {context.headlines.map((item) => (
                <li key={item.url}>
                  <a href={item.url} target="_blank" rel="noreferrer noopener">
                    <SafeText>{item.title}</SafeText>
                  </a>
                  <span className="context-news-meta">
                    {item.source ? <em>{item.source}</em> : null}
                    {item.publishedAt ? (
                      <time dateTime={item.publishedAt}>{item.publishedAt.slice(0, 10)}</time>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          /* Naming the reason matters: an empty list would otherwise read as
             "nothing happened", which is a different claim entirely. */
          <p className="context-news-empty">
            <SafeText>{context.headlinesUnavailableReason ?? "No headlines could be read."}</SafeText>
          </p>
        )}

        <p className="context-storage">
          <SafeText>{context.storage}</SafeText>
        </p>
        <p className="context-sources">
          {context.sources.map((source, index) => (
            <span key={source.url}>
              {index > 0 ? " · " : ""}
              <a href={source.url} target="_blank" rel="noreferrer noopener">
                {source.label}
              </a>
            </span>
          ))}
        </p>
      </div>
    </details>
  );
}

function QuoteCell({ quote }: { quote: LiveQuote }) {
  if (!quote.available) {
    return (
      <li className="context-cell" data-available="false">
        <span>{quote.label}</span>
        <strong>Unavailable</strong>
        {/* The reason is shown rather than hidden: a source that stopped
            publishing is itself information about the figure's reliability. */}
        <small><SafeText>{quote.unavailableReason ?? ""}</SafeText></small>
      </li>
    );
  }

  return (
    <li className="context-cell" data-available="true" title={quote.note ?? undefined}>
      <span>
        {quote.label}
        {quote.isProxy ? <em className="context-proxy" aria-label={quote.note ?? "proxy"}>proxy</em> : null}
      </span>
      <strong>{formatNumber(quote.price, quote.price !== null && quote.price < 100 ? 2 : 0)}</strong>
      <small className={movementClass(quote.changePercent)}>
        {formatPercent(quote.changePercent)}
        {quote.asOf ? <span className="context-asof"> · {quote.asOf}</span> : null}
      </small>
    </li>
  );
}
