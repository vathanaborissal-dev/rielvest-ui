import type { ReactNode } from "react";
import { cleanCopy } from "../_lib/format";
import type { Assessment } from "../_lib/types";

export function DataNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="data-notice" role="status">
      <div className="notice-mark" aria-hidden="true">i</div>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </section>
  );
}

export function AssessmentTag({ value }: { value: Assessment }) {
  const label = value === "insufficient_data" ? "Insufficient data" : value.replace("_", " ");
  return <span className="assessment-tag" data-assessment={value}>{label}</span>;
}

export function SourceFooter({ asOf }: { asOf?: string | null }) {
  return (
    <footer className="source-footer">
      <div>
        <strong>Data transparency</strong>
        <p>
          Market figures come from Cambodia&apos;s public financial datasets. RielVest labels calculated
          analysis separately and does not estimate missing values.
        </p>
      </div>
      <div className="source-links">
        <span>{asOf ? `Latest recorded session: ${asOf}` : "No session recorded"}</span>
        <a href="https://data.mef.gov.kh/" target="_blank" rel="noreferrer">MEF Open Data</a>
        <a href="https://csx.com.kh/" target="_blank" rel="noreferrer">Cambodia Securities Exchange</a>
      </div>
    </footer>
  );
}

export function SafeText({ children }: { children: string }) {
  return cleanCopy(children);
}
