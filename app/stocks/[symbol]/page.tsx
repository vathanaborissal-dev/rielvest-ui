import { DecisionReview } from "../../_components/decision-review";
import { Sparkline } from "../../_components/spark";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../_components/app-shell";
import { AssessmentTag, DataNotice, SafeText, SourceFooter } from "../../_components/data-ui";
import { StockPriceChart } from "../../_components/stock-price-chart";
import { StockAvatar } from "../../_components/stock-avatar";
import { TradePlanCard } from "../../_components/trade-plan-card";
import {
  getAnalysis,
  getCompany,
  getDecisionReview,
  getPriceChart,
  getQuickRead,
  getTradePlan,
} from "../../_lib/api";
import {
  cleanCopy,
  formatCompact,
  formatDate,
  formatKhr,
  formatMetric,
  formatNumber,
  formatPercent,
  movementClass,
} from "../../_lib/format";
import type { AnalysisFinding, StockAnalysis } from "../../_lib/types";

export default async function CompanyPage({ params }: PageProps<"/stocks/[symbol]">) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const [companyResult, analysisResult, chartResult, quickReadResult, planResult, reviewResult] =
    await Promise.all([
      getCompany(symbol),
      getAnalysis(symbol),
      getPriceChart(symbol, "1d", "1y"),
      getQuickRead(symbol),
      getTradePlan(symbol),
      getDecisionReview(symbol),
    ]);

  if (companyResult.status === 404) notFound();
  const bundle = companyResult.data;
  const analysis = analysisResult.data;
  const latest = bundle?.quotes.at(-1) ?? null;

  /**
   * CSX publishes P/E and P/B in its end-of-session summary, which lands hours
   * after the close — so the newest session routinely has a price and no
   * ratios. Showing the last published pair with the date it belongs to is more
   * useful than "Not available", and more honest than implying it is today's.
   */
  const reportedRatios = (() => {
    const quotes = bundle?.quotes ?? [];
    for (let index = quotes.length - 1; index >= 0; index -= 1) {
      const quote = quotes[index]!;
      if (quote.pe !== null || quote.pb !== null) {
        return { pe: quote.pe, pb: quote.pb, asOf: quote.tradeDate, isStale: quote !== latest };
      }
    }
    return null;
  })();

  const ratioNote = reportedRatios?.isStale ? `as at ${formatDate(reportedRatios.asOf)}` : undefined;
  const priorClose = latest?.change !== null && latest?.change !== undefined
    ? (latest?.close ?? 0) - latest.change
    : null;
  const changePercent = latest?.change !== null && latest?.change !== undefined && priorClose
    ? (latest.change / priorClose) * 100
    : null;

  return (
    <AppShell active="stocks">
      <Link className="back-link" href="/stocks">Back to stock explorer</Link>

      {!bundle ? (
        <DataNotice title="Company data is temporarily unavailable">
          {companyResult.error}
        </DataNotice>
      ) : (
        <>
          <header className="company-header">
            <div className="company-identity">
              <StockAvatar symbol={bundle.company.symbol} size={54} className="company-mark" />
              <div>
                <div className="company-title-line">
                  <h1>{bundle.company.name}</h1>
                  <span className="board-label">{bundle.company.board} board</span>
                </div>
                <p>{bundle.company.symbol} on the Cambodia Securities Exchange</p>
              </div>
            </div>
            <div className="company-price">
              <Sparkline values={planResult.data?.spark} width={78} height={24} />
              <span>Latest recorded price</span>
              <strong>{formatKhr(latest?.close)}</strong>
              <small data-movement={movementClass(changePercent)}>{formatPercent(changePercent)}</small>
            </div>
          </header>

          <section className="company-lead-grid">
            <div className="price-history-panel">
              <StockPriceChart
                symbol={bundle.company.symbol}
                initialSeries={chartResult.data}
                initialError={chartResult.error}
                initialQuickRead={quickReadResult.data}
              />
              <div className="quote-metrics">
                <MetricCell label="Volume" value={formatCompact(latest?.volume)} />
                <MetricCell label="Trading value" value={formatKhr(latest?.value, true)} />
                <MetricCell
                  label="P/E"
                  value={
                    reportedRatios?.pe == null ? "Not reported" : `${formatNumber(reportedRatios.pe, 2)}x`
                  }
                  note={reportedRatios?.pe == null ? undefined : ratioNote}
                />
                <MetricCell
                  label="P/B"
                  value={
                    reportedRatios?.pb == null ? "Not reported" : `${formatNumber(reportedRatios.pb, 2)}x`
                  }
                  note={reportedRatios?.pb == null ? undefined : ratioNote}
                />
              </div>

              {planResult.data ? <TradePlanCard plan={planResult.data} /> : null}
            </div>

            <aside className="company-profile-panel">
              <h2>Company profile</h2>
              <p className="company-description">
                <SafeText>{bundle.company.description ?? "A verified company description is not available."}</SafeText>
              </p>
              <dl>
                <div><dt>Sector</dt><dd>{bundle.company.sector ?? "Not available"}</dd></div>
                <div><dt>Industry</dt><dd>{bundle.company.industry ?? "Not available"}</dd></div>
                <div><dt>Listed</dt><dd>{formatDate(bundle.company.listingDate)}</dd></div>
                <div><dt>ISIN</dt><dd>{bundle.company.isin ?? "Not available"}</dd></div>
              </dl>
              {bundle.company.website ? (
                <a className="secondary-button" href={bundle.company.website} target="_blank" rel="noreferrer">Company website</a>
              ) : null}
            </aside>
          </section>

          {reviewResult.data?.review ? <DecisionReview review={reviewResult.data.review} /> : null}
          <AnalysisSection analysis={analysis} error={analysisResult.error} />

          <section className="dividend-panel">
            <div className="section-heading-row">
              <div>
                <h2>Dividend history</h2>
                <p>Only published cash distributions recorded by the data service.</p>
              </div>
              <span>{bundle.dividends.length} records</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Fiscal year</th><th>Type</th><th>Per share</th><th>Ex-date</th><th>Payment date</th></tr></thead>
                <tbody>
                  {bundle.dividends.length ? bundle.dividends.map((dividend, index) => (
                    <tr key={`${dividend.fiscalYear}-${dividend.type}-${index}`}>
                      <td>{dividend.fiscalYear}</td>
                      <td>{dividend.type}</td>
                      <td className="numeric">{formatKhr(dividend.amountPerShare)}</td>
                      <td>{formatDate(dividend.exDate)}</td>
                      <td>{formatDate(dividend.paymentDate)}</td>
                    </tr>
                  )) : <tr><td className="empty-cell" colSpan={5}>No verified dividend records are available.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="company-source">
            <div>
              <strong>Company reference</strong>
              <p>{bundle.company.reference.note ? cleanCopy(bundle.company.reference.note) : "Compiled from public listing records."}</p>
            </div>
            {bundle.company.reference.url ? (
              <a href={bundle.company.reference.url} target="_blank" rel="noreferrer">Open source record</a>
            ) : null}
          </footer>
          <SourceFooter asOf={latest?.tradeDate} />
        </>
      )}
    </AppShell>
  );
}

function MetricCell({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <em className="metric-note">{note}</em> : null}
    </div>
  );
}

function AnalysisSection({ analysis, error }: { analysis: StockAnalysis | null; error: string | null }) {
  if (!analysis) {
    return <DataNotice title="Analysis is not available">{error ?? "The analysis engine returned no result."}</DataNotice>;
  }

  const uniqueGaps = [...new Set(analysis.categories.flatMap((category) => category.dataGaps))];

  return (
    <section className="analysis-section">
      <div className="analysis-overview">
        <div>
          <span>Transparent stock analysis</span>
          <h2>What the current data says</h2>
          <div className="analysis-tags">
            <AssessmentTag value={analysis.assessment} />
            <span>As of {formatDate(analysis.asOf)}</span>
            <span>Recalculated from latest stored data</span>
          </div>
        </div>
        <div className="score-block">
          <div><span>Overall score</span><strong>{analysis.score === null ? "Not scored" : `${analysis.score}/100`}</strong></div>
          <div><span>Analysis coverage</span><strong>{formatPercent(analysis.coverage, false)}</strong></div>
        </div>
      </div>

      {/* Every sentence here restates a figure from the tables below, so it
          reads as repetition rather than explanation when left open. */}
      {analysis.narrative.length ? (
        <details className="analysis-narrative">
          <summary>Read this in sentences</summary>
          {analysis.narrative.map((line, index) => <p key={index}><SafeText>{line}</SafeText></p>)}
        </details>
      ) : null}

      <div className="category-grid">
        {analysis.categories.map((category) => (
          <article className="category-card" key={category.key}>
            <div className="category-title">
              <h3 title={category.question}>{category.label}</h3>
              <AssessmentTag value={category.assessment} />
            </div>
            <div className="category-metrics">
              {category.metrics.slice(0, 4).map((metric) => (
                <div key={metric.key}>
                  <span>{metric.label}</span>
                  <strong>{formatMetric(metric)}</strong>
                  <small>{metric.provenance}</small>
                </div>
              ))}
            </div>
            {category.dataGaps.length ? (
              <p className="data-gap-flag" title={cleanCopy(category.dataGaps[0]!)}>Data gap</p>
            ) : null}
          </article>
        ))}
      </div>

      {uniqueGaps.length ? (
        <details className="data-gap-summary">
          <summary>
            {uniqueGaps.length} thing{uniqueGaps.length === 1 ? "" : "s"} this analysis cannot assess
          </summary>
          {uniqueGaps.map((gap) => <p key={gap}>{cleanCopy(gap)}</p>)}
        </details>
      ) : null}

      <div className="finding-grid">
        <FindingList title="Risks and cautions" findings={analysis.risks} limit={3} empty="No risk finding could be formed from current data." />
        <FindingList title="Positive signals" findings={analysis.opportunities} limit={2} empty="No positive finding could be formed from current data." />
      </div>
      <details className="methodology analysis-methodology">
        <summary>Read the scoring methodology</summary>
        <p><SafeText>{analysis.methodology}</SafeText></p>
      </details>
    </section>
  );
}

function FindingList({ title, findings, empty, limit = 4 }: { title: string; findings: AnalysisFinding[]; empty: string; limit?: number }) {
  return (
    <section>
      <h3>{title}</h3>
      {findings.length ? findings.slice(0, limit).map((finding, index) => (
        <div className="finding" key={index}>
          <AssessmentTag value={finding.assessment} />
          <p><SafeText>{finding.statement}</SafeText></p>
        </div>
      )) : <p className="muted-copy">{empty}</p>}
    </section>
  );
}
