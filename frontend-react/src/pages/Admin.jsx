import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { fetchAdminStats, fetchAdminUsers, fetchAdminFeedback, fetchAdminReviews } from "../api/services";
import { codeToName } from "../utils/serviceNames";

const TABS = [
  { key: "Dashboard", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { key: "Users", icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" },
  { key: "Feedback", icon: "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" },
  { key: "Reviews", icon: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" },
];

const PAGE_SIZE = 50;

function TabIcon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

export default function Admin() {
  const { user, authHeader } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    document.title = "Admin Dashboard — Government Guide";
    return () => { document.title = "Government Guide Companion"; };
  }, [user, navigate]);

  useEffect(() => {
    if (!authHeader) return;
    setLoading(true);
    Promise.all([
      fetchAdminStats(authHeader).catch(() => null),
      fetchAdminUsers(authHeader).catch(() => null),
      fetchAdminFeedback(authHeader).catch(() => null),
      fetchAdminReviews(authHeader).catch(() => null),
    ]).then(([s, u, f, r]) => {
      setStats(s);
      setUsers(u);
      setFeedback(f);
      setReviews(r);
      setLoading(false);
    });
  }, [authHeader]);

  if (!user) return null;

  return (
    <div className="admin-page">
      <div className="shell">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <div className="admin-icon-circle" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>
            </div>
            <div>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">GovGuide analytics and management</p>
            </div>
          </div>
          <Link to="/profile" className="admin-back-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
            Profile
          </Link>
        </div>

        <nav className="admin-nav" role="tablist">
          {TABS.map(t => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`admin-nav-btn ${tab === t.key ? "admin-nav-btn--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <TabIcon d={t.icon} />
              <span>{t.key}</span>
            </button>
          ))}
        </nav>

        {loading && (
          <div className="admin-loading">
            <div className="admin-spinner" />
            <p>Loading dashboard data...</p>
          </div>
        )}

        {!loading && tab === "Dashboard" && stats && <DashboardTab stats={stats} />}
        {!loading && tab === "Users" && users && <UsersTab users={users} />}
        {!loading && tab === "Feedback" && feedback && <FeedbackTab feedback={feedback} />}
        {!loading && tab === "Reviews" && reviews && <ReviewsTab reviews={reviews} />}
      </div>
    </div>
  );
}

/* ---- Dashboard Tab ---- */

function StatCard({ label, value, icon, color }) {
  return (
    <div className="admin-stat" style={{ "--stat-color": color }}>
      <div className="admin-stat-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d={icon} /></svg>
      </div>
      <div className="admin-stat-body">
        <span className="admin-stat-value">{typeof value === "number" ? value.toLocaleString() : value}</span>
        <span className="admin-stat-label">{label}</span>
      </div>
    </div>
  );
}

function DashboardTab({ stats }) {
  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="admin-section">
      <div className="admin-stats-grid">
        <StatCard label="Total Users" value={stats.totalUsers} color="#3B82F6"
          icon="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        <StatCard label="Total Tasks" value={stats.totalTasks} color="#8B5CF6"
          icon="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
        <StatCard label="Completed" value={`${stats.completedTasks.toLocaleString()} (${completionRate}%)`} color="#10B981"
          icon="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        <StatCard label="Feedback" value={stats.totalFeedback} color="#F59E0B"
          icon="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        <StatCard label="Reviews" value={stats.totalReviews} color="#EC4899"
          icon="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        <StatCard label="Avg Rating" value={`${stats.averageRating} / 5`} color="#06B6D4"
          icon="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </div>

      <div className="admin-grid-2">
        {stats.topServices?.length > 0 && (
          <div className="admin-card admin-card--full">
            <div className="admin-card-header">
              <h3>Most Used Services</h3>
              <span className="admin-card-badge">{stats.topServices.length} services</span>
            </div>
            <div className="admin-service-bars">
              {stats.topServices.slice(0, 10).map((s, i) => {
                const max = stats.topServices[0].taskCount;
                const pct = (s.taskCount / max) * 100;
                return (
                  <div key={s.serviceCode} className="admin-sbar">
                    <div className="admin-sbar-head">
                      <span className="admin-sbar-rank">#{i + 1}</span>
                      <Link to={`/service/${s.serviceCode.toLowerCase()}`} className="admin-sbar-name">{codeToName(s.serviceCode)}</Link>
                      <span className="admin-sbar-count">{s.taskCount.toLocaleString()}</span>
                    </div>
                    <div className="admin-bar"><div className="admin-bar-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {stats.feedbackByType && Object.keys(stats.feedbackByType).length > 0 && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Feedback by Type</h3>
            </div>
            <div className="admin-type-grid">
              {Object.entries(stats.feedbackByType).map(([type, count]) => (
                <div key={type} className={`admin-type-card admin-type-card--${type.toLowerCase()}`}>
                  <span className="admin-type-count">{count.toLocaleString()}</span>
                  <span className="admin-type-label">{type.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.topFeedbackServices?.length > 0 && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Top Feedback Services</h3>
            </div>
            <div className="admin-service-bars">
              {stats.topFeedbackServices.slice(0, 8).map((s, i) => {
                const max = stats.topFeedbackServices[0].feedbackCount;
                const pct = (s.feedbackCount / max) * 100;
                return (
                  <div key={s.serviceCode} className="admin-sbar">
                    <div className="admin-sbar-head">
                      <span className="admin-sbar-rank">#{i + 1}</span>
                      <Link to={`/service/${s.serviceCode.toLowerCase()}`} className="admin-sbar-name">{codeToName(s.serviceCode)}</Link>
                      <span className="admin-sbar-count">{s.feedbackCount.toLocaleString()}</span>
                    </div>
                    <div className="admin-bar"><div className="admin-bar-fill admin-bar-fill--amber" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Users Tab ---- */

function UsersTab({ users }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () => (users.users || []).filter(u => u.toLowerCase().includes(search.toLowerCase())),
    [users.users, search]
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="admin-section">
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Registered Users</h3>
          <span className="admin-card-badge">{filtered.length.toLocaleString()} {search ? "found" : "total"}</span>
        </div>
        <div className="admin-search-wrap">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="admin-search-icon" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
          <input
            type="search"
            placeholder="Search users by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-search"
          />
        </div>
        <div className="admin-user-list">
          {pageUsers.map((u, i) => (
            <div key={u} className="admin-user-row">
              <span className="admin-user-num">{(page - 1) * PAGE_SIZE + i + 1}</span>
              <span className="admin-user-avatar">{u.charAt(0).toUpperCase()}</span>
              <span className="admin-user-name">{u}</span>
            </div>
          ))}
          {filtered.length === 0 && <p className="admin-empty">No users match your search.</p>}
        </div>
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button
              className="admin-page-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
              Prev
            </button>
            <span className="admin-page-info">
              Page {page} of {totalPages} <span className="admin-page-range">({((page - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(page * PAGE_SIZE, filtered.length).toLocaleString()})</span>
            </span>
            <button
              className="admin-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Feedback Tab ---- */

function FeedbackTab({ feedback }) {
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const types = ["ALL", ...new Set((feedback.feedback || []).map(f => f.type))];
  const list = filter === "ALL" ? feedback.feedback : feedback.feedback.filter(f => f.type === filter);
  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filter]);

  const typeCounts = useMemo(() => {
    const counts = {};
    (feedback.feedback || []).forEach(f => { counts[f.type] = (counts[f.type] || 0) + 1; });
    return counts;
  }, [feedback.feedback]);

  return (
    <div className="admin-section">
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Feedback</h3>
          <span className="admin-card-badge">{list.length.toLocaleString()} {filter !== "ALL" ? filter.replace(/_/g, " ").toLowerCase() : "total"}</span>
        </div>
        <div className="admin-filter-row">
          {types.map(t => (
            <button key={t} className={`admin-filter-btn ${filter === t ? "admin-filter-btn--active" : ""}`} onClick={() => setFilter(t)}>
              {t === "ALL" ? "All" : t.replace(/_/g, " ")}
              {t !== "ALL" && <span className="admin-filter-count">{typeCounts[t] || 0}</span>}
            </button>
          ))}
        </div>
        {pageItems.length === 0 && <p className="admin-empty">No feedback found.</p>}
        <div className="admin-feed-list">
          {pageItems.map(f => (
            <div key={f.id} className="admin-feed-card">
              <div className="admin-feed-top">
                <span className={`admin-feed-badge admin-feed-badge--${f.type.toLowerCase()}`}>{f.type.replace(/_/g, " ")}</span>
                <span className="admin-feed-time">{new Date(f.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <p className="admin-feed-msg">{f.message}</p>
              <div className="admin-feed-footer">
                <Link to={`/service/${f.serviceCode.toLowerCase()}`} className="admin-feed-service">{codeToName(f.serviceCode)}</Link>
                <span className="admin-feed-user">by {f.username}</span>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
              Prev
            </button>
            <span className="admin-page-info">Page {page} of {totalPages}</span>
            <button className="admin-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Reviews Tab ---- */

function ReviewsTab({ reviews }) {
  const [page, setPage] = useState(1);
  const list = reviews.reviews || [];
  const totalPages = Math.ceil(list.length / PAGE_SIZE);
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const maxDist = Math.max(...Object.values(reviews.distribution || {}), 1);

  return (
    <div className="admin-section">
      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Rating Overview</h3>
          </div>
          <div className="admin-rating-big">
            <span className="admin-rating-number">{reviews.averageRating}</span>
            <span className="admin-rating-of">/5</span>
          </div>
          <div className="admin-rating-stars-big">
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} className={n <= Math.round(reviews.averageRating) ? "admin-star--filled" : "admin-star--empty"}>★</span>
            ))}
          </div>
          <p className="admin-rating-total">{reviews.total.toLocaleString()} reviews</p>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Rating Distribution</h3>
          </div>
          <div className="admin-rating-dist">
            {[5, 4, 3, 2, 1].map(n => {
              const count = reviews.distribution?.[n] || 0;
              const pct = (count / maxDist) * 100;
              return (
                <div key={n} className="admin-dist-row">
                  <span className="admin-dist-label">{n} ★</span>
                  <div className="admin-bar admin-bar--lg">
                    <div
                      className={`admin-bar-fill admin-bar-fill--star${n}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="admin-dist-count">{count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>All Reviews</h3>
          <span className="admin-card-badge">{list.length.toLocaleString()} total</span>
        </div>
        <div className="admin-feed-list">
          {pageItems.map(r => (
            <div key={r.id} className="admin-feed-card">
              <div className="admin-feed-top">
                <span className="admin-review-stars">
                  {[1, 2, 3, 4, 5].map(n => (
                    <span key={n} className={n <= r.rating ? "admin-star--filled" : "admin-star--empty"}>★</span>
                  ))}
                </span>
                <span className="admin-feed-time">{new Date(r.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <p className="admin-feed-msg">{r.message}</p>
              <div className="admin-feed-footer">
                <Link to={`/service/${r.serviceCode.toLowerCase()}`} className="admin-feed-service">{codeToName(r.serviceCode)}</Link>
                <span className="admin-feed-user">by {r.username}</span>
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="admin-empty">No reviews yet.</p>}
        </div>
        {totalPages > 1 && (
          <div className="admin-pagination">
            <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
              Prev
            </button>
            <span className="admin-page-info">Page {page} of {totalPages}</span>
            <button className="admin-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
