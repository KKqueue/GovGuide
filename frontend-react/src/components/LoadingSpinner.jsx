export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <span className="loading-dot" aria-hidden="true"></span>
      <span>{text}</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <article className="catalogue-card skeleton">
      <div className="catalogue-card-header">
        <span className="skeleton-block" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <span className="skeleton-block" style={{ width: 100, height: 20 }} />
      </div>
      <div className="skeleton-block" style={{ width: "70%", height: 22, marginBottom: 8 }} />
      <div className="skeleton-block" style={{ width: "100%", height: 14 }} />
      <div className="skeleton-block" style={{ width: "85%", height: 14, marginTop: 4 }} />
    </article>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="catalogue-list">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function ServiceDetailSkeleton() {
  return (
    <div className="service-detail-page skeleton" aria-hidden="true">
      <div className="shell">
        <span className="skeleton-block" style={{ width: 160, height: 18, marginBottom: 32 }} />
        <div className="service-detail-layout">
          <div className="service-main">
            <div style={{ marginBottom: 20 }}>
              <span className="skeleton-block" style={{ width: "75%", height: 30, marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <span className="skeleton-block" style={{ width: 100, height: 24, borderRadius: 20 }} />
                <span className="skeleton-block" style={{ width: 80, height: 24, borderRadius: 20 }} />
              </div>
            </div>
            <span className="skeleton-block" style={{ width: "100%", height: 14, marginBottom: 6 }} />
            <span className="skeleton-block" style={{ width: "95%", height: 14, marginBottom: 6 }} />
            <span className="skeleton-block" style={{ width: "60%", height: 14, marginBottom: 36 }} />
            <div className="service-glance skeleton">
              <span className="skeleton-block" style={{ width: 160, height: 22, marginBottom: 16 }} />
              <div className="glance-grid">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="glance-item" style={{ border: "none" }}>
                    <span className="skeleton-block" style={{ width: 90, height: 14 }} />
                    <span className="skeleton-block" style={{ width: 120, height: 18 }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 32 }}>
              <span className="skeleton-block" style={{ width: 180, height: 20, marginBottom: 16 }} />
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <span className="skeleton-block" style={{ width: 70, height: 22, borderRadius: 4 }} />
                  <span className="skeleton-block" style={{ width: "60%", height: 14 }} />
                </div>
              ))}
            </div>
          </div>
          <aside className="service-sidebar">
            <div className="sidebar-section skeleton">
              <span className="skeleton-block" style={{ width: "80%", height: 18, marginBottom: 16 }} />
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <span className="skeleton-block" style={{ width: "100%", height: 14, marginBottom: 4 }} />
                  <span className="skeleton-block" style={{ width: "70%", height: 14 }} />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
