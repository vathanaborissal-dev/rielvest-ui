import { AssessmentTag, SafeText } from "./data-ui";
import { formatDate } from "../_lib/format";
import type { DecisionReview as Review } from "../_lib/types";

/**
 * The verdict, then the reasoning.
 *
 * This used to fetch on the client when opened, so the conclusion sat behind a
 * click and a spinner — on a page nobody reads carefully, that is the same as
 * not being there. The page already loads the analysis and the plan on the
 * server, so the review comes with them: stance, headline and a scored bar per
 * category are visible immediately, and only the sentences are collapsed.
 *
 * It reads stored analysis, so rendering it eagerly never triggers a model
 * request.
 */
export function DecisionReview({ review }: { review?: Review | null }) {
  // Defensive for the same reason the sparkline is: this renders on the server
  // against a payload that can lag a deploy, and a missing field must cost a
  // card, never the page.
  const factors = Array.isArray(review?.factors) ? review.factors : [];
  if (!review || factors.length === 0) return null;
  const scored = factors.filter((factor) => factor.score !== null);

  return (
    <section className="decision-review" data-stance={review.stance}>
      <div className="review-verdict">
        <span className="review-stance">{stanceLabel(review.stance)}</span>
        <strong>
          <SafeText>{review.headline}</SafeText>
        </strong>
        <span className="review-asof">
          {formatDate(review.asOf)} · {scored.length}/{factors.length} scored
        </span>
      </div>

      {/* Six bars say which parts of the business hold up and which do not,
          in the time it takes to read none of the sentences below. */}
      <ul className="factor-bars">
        {factors.map((factor) => (
          <li key={factor.label} data-assessment={factor.assessment} title={`${factor.label}: ${factor.assessment.replace(/_/g, " ")}`}>
            <span className="factor-label">{factor.label}</span>
            <span className="factor-track">
              <span
                className="factor-fill"
                style={{ width: `${Math.max(3, Math.min(100, factor.score ?? 0))}%` }}
              />
            </span>
            <span className="factor-score">{factor.score === null ? "—" : factor.score}</span>
          </li>
        ))}
      </ul>

      <details className="review-detail">
        <summary>Why, and what to check next</summary>
        <div className="review-body">
          <div className="review-balance">
            <div>
              <h4>What supports it</h4>
              {review.strengths?.length ? (
                review.strengths!.map((line) => (
                  <p key={line}>
                    <SafeText>{line}</SafeText>
                  </p>
                ))
              ) : (
                <p>No clear positive finding in the available data.</p>
              )}
            </div>
            <div>
              <h4>Reasons to wait</h4>
              {review.cautions?.length ? (
                review.cautions!.map((line) => (
                  <p key={line}>
                    <SafeText>{line}</SafeText>
                  </p>
                ))
              ) : (
                <p>No caution was raised by the current data.</p>
              )}
            </div>
          </div>

          <p className="review-next">
            <strong>Next check:</strong> <SafeText>{review.nextCheck}</SafeText>
          </p>

          {review.gaps?.length ? (
            <p className="review-gaps">
              <SafeText>{review.gaps!.join(" ")}</SafeText>
            </p>
          ) : null}

          {review.news?.length ? (
            <ul className="review-news">
              {review.news!.map((item) => (
                <li key={`${item.date}-${item.title}`}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer noopener">
                      <SafeText>{item.title}</SafeText>
                    </a>
                  ) : (
                    <SafeText>{item.title}</SafeText>
                  )}
                  <time dateTime={item.date}>{item.date}</time>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="review-source">
            {review.summary?.source === "model"
              ? `Wording assisted by ${review.summary?.model ?? "a model"}; every figure is checked against the computed analysis.`
              : "Wording from the analysis engine."}{" "}
            A checklist for further research, never a trade instruction.
          </p>
        </div>
      </details>
    </section>
  );
}

function stanceLabel(stance: Review["stance"]): string {
  if (stance === "research") return "Worth researching";
  if (stance === "wait") return "Wait";
  return "Not enough data";
}

export { AssessmentTag };
