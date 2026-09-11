"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "./icons";

const BOARDS = [
  { value: "all", label: "All boards" },
  { value: "main", label: "Main Board" },
  { value: "growth", label: "Growth Board" },
];

const SORTS = [
  { value: "symbol", label: "Ticker" },
  { value: "price", label: "Price" },
  { value: "change", label: "Daily change" },
  { value: "value", label: "Trading value" },
  { value: "pe", label: "P/E" },
];

/**
 * Filters for the stock explorer.
 *
 * The dropdowns apply on change rather than waiting for a submit button: with
 * twelve companies the result is instant, and an extra click to see it is
 * friction with nothing behind it. The search box still submits on Enter,
 * because typing and navigating on every keystroke would be worse.
 */
export function StockFilters({
  search,
  board,
  sort,
}: {
  search: string;
  board: string;
  sort: string;
}) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);

  const apply = useCallback(
    (patch: { q?: string; board?: string; sort?: string }) => {
      const params = new URLSearchParams();
      const next = { q: searchValue, board, sort, ...patch };
      if (next.q) params.set("q", next.q);
      if (next.board && next.board !== "all") params.set("board", next.board);
      if (next.sort && next.sort !== "symbol") params.set("sort", next.sort);
      const query = params.toString();
      router.push(query ? `/stocks?${query}` : "/stocks");
    },
    [board, router, searchValue, sort],
  );

  return (
    <form
      className="stock-filters"
      onSubmit={(event) => {
        event.preventDefault();
        apply({});
      }}
    >
      <label className="filter-search">
        <span>Search companies</span>
        <span className="filter-search-field">
          <SearchIcon />
          <input
            name="q"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Ticker or company name"
          />
        </span>
      </label>

      <label>
        <span>Board</span>
        <Select value={board} onValueChange={(value) => apply({ board: value })}>
          <SelectTrigger aria-label="Board">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BOARDS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label>
        <span>Sort by</span>
        <Select value={sort} onValueChange={(value) => apply({ sort: value })}>
          <SelectTrigger aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </form>
  );
}
