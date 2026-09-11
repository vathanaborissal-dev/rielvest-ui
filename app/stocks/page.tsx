import Link from "next/link";
import { AppShell, PageHeader } from "../_components/app-shell";
import { DataNotice, SourceFooter } from "../_components/data-ui";
import { StockAvatar } from "../_components/stock-avatar";
import { StockFilters } from "../_components/stock-filters";
import { getCompanies } from "../_lib/api";
import { formatCompact, formatKhr, formatNumber, formatPercent, movementClass } from "../_lib/format";
import type { CompanyListItem } from "../_lib/types";

type SortKey = "symbol" | "price" | "change" | "value" | "pe";

export default async function StocksPage({ searchParams }: PageProps<"/stocks">) {
  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.trim() : "";
  const board = query.board === "main" || query.board === "growth" ? query.board : "all";
  const sort = isSortKey(query.sort) ? query.sort : "symbol";
  const result = await getCompanies({ search, board });
  const companies = sortCompanies(result.data ?? [], sort);

  return (
    <AppShell active="stocks">
      <PageHeader
        eyebrow="CSX listed companies"
        title="Stock explorer"
        description="Compare verified prices, trading activity and published valuation metrics across Cambodia's listed companies."
        meta={<div className="session-meta"><span>Companies shown</span><strong>{companies.length}</strong></div>}
      />

      <StockFilters search={search} board={board} sort={sort} />

      {result.error ? (
        <DataNotice title="Company data is temporarily unavailable">{result.error}</DataNotice>
      ) : null}

      <section className="stock-directory">
        <div className="directory-head">
          <p>
            {search ? `Results matching “${search}”` : "All listed companies"}
            {board !== "all" ? ` on the ${board} board` : ""}
          </p>
          {(search || board !== "all" || sort !== "symbol") && <Link href="/stocks">Clear filters</Link>}
        </div>
        <div className="table-scroll">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Board</th>
                <th>Price</th>
                <th>Daily change</th>
                <th>Volume</th>
                <th>P/E</th>
                <th>P/B</th>
              </tr>
            </thead>
            <tbody>
              {companies.length ? companies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <Link className="stock-name" href={`/stocks/${company.symbol}`}>
                      <StockAvatar symbol={company.symbol} size={30} className="ticker-mark" />
                      <span><strong>{company.symbol}</strong><small>{company.name}</small></span>
                    </Link>
                  </td>
                  <td><span className="board-label">{company.board}</span></td>
                  <td className="numeric">{formatKhr(company.close)}</td>
                  <td className="numeric" data-movement={movementClass(company.changePercent)}>{formatPercent(company.changePercent)}</td>
                  <td className="numeric">{formatCompact(company.volume)}</td>
                  <td className="numeric">{company.pe == null ? "Not reported" : `${formatNumber(company.pe, 2)}x`}</td>
                  <td className="numeric">{company.pb == null ? "Not reported" : `${formatNumber(company.pb, 2)}x`}</td>
                </tr>
              )) : (
                <tr><td className="empty-cell" colSpan={7}>No companies match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <SourceFooter asOf={companies.find((company) => company.tradeDate)?.tradeDate} />
    </AppShell>
  );
}

function isSortKey(value: unknown): value is SortKey {
  return value === "symbol" || value === "price" || value === "change" || value === "value" || value === "pe";
}

function sortCompanies(companies: CompanyListItem[], sort: SortKey): CompanyListItem[] {
  return [...companies].sort((a, b) => {
    if (sort === "symbol") return a.symbol.localeCompare(b.symbol);
    const values: Record<Exclude<SortKey, "symbol">, [number | null, number | null]> = {
      price: [a.close, b.close],
      change: [a.changePercent, b.changePercent],
      value: [a.value, b.value],
      pe: [a.pe, b.pe],
    };
    const [left, right] = values[sort];
    return (right ?? Number.NEGATIVE_INFINITY) - (left ?? Number.NEGATIVE_INFINITY);
  });
}
