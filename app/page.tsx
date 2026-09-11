import Link from "next/link";
import { AppShell, PageHeader } from "./_components/app-shell";
import { AssessmentTag, DataNotice, SafeText, SourceFooter } from "./_components/data-ui";
import { MarketChart } from "./_components/market-chart";
import { StockAvatar } from "./_components/stock-avatar";
import { getIndexSeries, getMarketOverview } from "./_lib/api";
import {
  formatCompact,
  formatDate,
  formatKhr,
  formatNumber,
  formatPercent,
  movementClass,
} from "./_lib/format";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const [overviewResult, indexResult] = await Promise.all([
    getMarketOverview(),
    getIndexSeries(365),
  ]);
  const market = overviewResult.data;
  const indexSeries = indexResult.data ?? [];
  const hasSession = Boolean(market?.tradeDate);

  return (
    <AppShell active="market">
      <PageHeader
        eyebrow="Cambodia market overview"
        title="Market today"
        description="A clear read of the latest recorded CSX session, grounded in published data."
        meta={
          <div className="session-meta">
            <span>End-of-day data</span>
            <strong>{formatDate(market?.tradeDate)}</strong>
          </div>
        }
      />

      {!market ? (
        <DataNotice title="Market data is temporarily unavailable">
          {overviewResult.error} The interface is intentionally blank until a verified response is available.
        </DataNotice>
      ) : !market.tradeDate ? (
        <DataNotice title="No trading session has been recorded">
          Run the backend ingestion process to populate the first verified market snapshot.
        </DataNotice>
      ) : null}

      <section className="market-lead" aria-label="CSX index overview">
        <div className="index-panel">
          <div className="panel-kicker">
            <span>CSX Index</span>
            <span>1 year</span>
          </div>
          <div className="index-value-row">
            <div>
              <strong className="index-value">
                {market?.index ? formatNumber(market.index.value, 2) : "Not available"}
              </strong>
              <span
                className="market-move"
                data-movement={movementClass(market?.index?.changePercent)}
              >
                {formatPercent(market?.index?.changePercent)}
              </span>
            </div>
            <p>
              {market?.index
                ? `Session range ${formatNumber(market.index.low, 2)} to ${formatNumber(market.index.high, 2)}`
                : "No verified index observation"}
            </p>
          </div>
          <MarketChart points={indexSeries} />
        </div>

        <aside className="commentary-panel">
          <div className="panel-kicker">
            <span>RielVest analysis</span>
            {market ? <AssessmentTag value={market.commentary.sentiment} /> : null}
          </div>
          <h2>{market ? <SafeText>{market.commentary.headline}</SafeText> : "Waiting for verified data"}</h2>
          <div className="commentary-points">
            {market?.commentary.points.slice(0, 4).map((point, index) => (
              <div className="commentary-point" key={`${point.kind}-${index}`}>
                <span>{point.kind === "data" ? "Reported" : point.kind === "gap" ? "Data gap" : "Interpretation"}</span>
                <p><SafeText>{point.statement}</SafeText></p>
              </div>
            )) ?? (
              <p className="muted-copy">Analysis appears only when the API returns a recorded session.</p>
            )}
          </div>
          {market ? (
            <details className="methodology">
              <summary>How this reading is produced</summary>
              <p><SafeText>{market.commentary.method}</SafeText></p>
            </details>
          ) : null}
        </aside>
      </section>

      <section className="metric-strip" aria-label="Market session metrics">
        <article>
          <span>Market value traded</span>
          <strong>{formatKhr(hasSession ? market?.totalValue : null, true)}</strong>
          <small>Reported session total</small>
        </article>
        <article>
          <span>Trading volume</span>
          <strong>{hasSession ? `${formatCompact(market?.totalVolume)} shares` : "Not available"}</strong>
          <small>Reported session total</small>
        </article>
        <article>
          <span>Market capitalization</span>
          <strong>{formatKhr(hasSession ? market?.totalMarketCap : null, true)}</strong>
          <small>{market?.totalMarketCapPeriod ?? "Period not available"}</small>
        </article>
        <article>
          <span>Companies quoted</span>
          <strong>{hasSession && market ? `${market.quotedCount} of ${market.listedCount}` : "Not available"}</strong>
          <small>Latest recorded feed</small>
        </article>
      </section>

      <section className="market-detail-grid">
        <div className="table-panel">
          <div className="section-heading-row">
            <div>
              <h2>Listed stocks</h2>
              <p>Price, movement and activity from the latest recorded session.</p>
            </div>
            <Link className="text-link" href="/stocks">Explore all stocks</Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>Volume</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {hasSession && market?.quotes.length ? (
                  [...market.quotes]
                    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
                    .slice(0, 7)
                    .map((quote) => (
                      <tr key={quote.symbol}>
                        <td>
                          <Link className="stock-name" href={`/stocks/${quote.symbol}`}>
                            <StockAvatar symbol={quote.symbol} size={30} className="ticker-mark" />
                            <span><strong>{quote.symbol}</strong><small>{quote.name}</small></span>
                          </Link>
                        </td>
                        <td className="numeric">{formatKhr(quote.close)}</td>
                        <td className="numeric" data-movement={movementClass(quote.changePercent)}>
                          {formatPercent(quote.changePercent)}
                        </td>
                        <td className="numeric">{formatCompact(quote.volume)}</td>
                        <td className="numeric">{formatKhr(quote.value, true)}</td>
                      </tr>
                    ))
                ) : (
                  <tr><td colSpan={5} className="empty-cell">No verified quotes are available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="breadth-panel">
          <div>
            <h2>Market breadth</h2>
            <p>How widely the session&apos;s direction was shared.</p>
          </div>
          <div className="breadth-list">
            <BreadthRow label="Advanced" value={market?.breadth.advancing} total={market?.breadth.total} tone="positive" />
            <BreadthRow label="Declined" value={market?.breadth.declining} total={market?.breadth.total} tone="negative" />
            <BreadthRow label="Unchanged" value={market?.breadth.unchanged} total={market?.breadth.total} tone="flat" />
            <BreadthRow label="Not traded" value={market?.breadth.notTrading} total={market?.breadth.total} tone="muted" />
          </div>
          <div className="valuation-summary">
            <span>Market median valuation</span>
            <div><strong>{market?.medianPe === null || market?.medianPe === undefined ? "Not available" : `${formatNumber(market.medianPe, 2)}x`}</strong><small>P/E</small></div>
            <div><strong>{market?.medianPb === null || market?.medianPb === undefined ? "Not available" : `${formatNumber(market.medianPb, 2)}x`}</strong><small>P/B</small></div>
          </div>
        </aside>
      </section>

      <SourceFooter asOf={market?.tradeDate} />
    </AppShell>
  );
}

function BreadthRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number | undefined;
  total: number | undefined;
  tone: string;
}) {
  const proportion = value !== undefined && total ? (value / total) * 100 : 0;
  return (
    <div className="breadth-row">
      <div><span>{label}</span><strong>{value ?? "Not available"}</strong></div>
      <div className="breadth-track" aria-hidden="true">
        <span data-tone={tone} style={{ width: `${proportion}%` }} />
      </div>
    </div>
  );
}
