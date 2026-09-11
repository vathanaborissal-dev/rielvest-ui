export default function Loading() {
  return (
    <div className="loading-page" aria-label="Loading market data" aria-busy="true">
      <div className="loading-sidebar" />
      <main>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-subtitle" />
        <div className="loading-grid">
          <div className="skeleton skeleton-large" />
          <div className="skeleton skeleton-large" />
        </div>
        <div className="skeleton skeleton-table" />
      </main>
    </div>
  );
}
