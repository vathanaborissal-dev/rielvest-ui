import Link from "next/link";

export default function NotFound() {
  return (
    <main className="standalone-state">
      <span className="brand-mark standalone-mark" aria-hidden="true"><span /><span /><span /></span>
      <p>Company not found</p>
      <h1>That ticker is not listed in RielVest.</h1>
      <Link className="primary-button" href="/stocks">Browse listed stocks</Link>
    </main>
  );
}
