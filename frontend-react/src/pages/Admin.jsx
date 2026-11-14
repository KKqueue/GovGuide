import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { fetchAdminStats, fetchAdminUsers, fetchAdminFeedback, fetchAdminReviews } from "../api/services";
import { codeToName } from "../utils/serviceNames";

const TABS = ["Dashboard", "Users", "Feedback", "Reviews"];

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
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <Link to="/profile" className="button button-secondary">Back to profile</Link>
        </div>

        <div className="admin-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`admin-tab ${tab === t ? "admin-tab--active" : ""}`}
              onClick={() => setTab(t)}
            >{t}</button>
          ))}
        </div>

        {loading && <p className="admin-loading">Loading dashboard data...</p>}

        {!loading && tab === "Dashboard" && stats && <DashboardTab stats={stats} />}
        {!loading && tab === "Users" && users && <UsersTab users={users} />}
        {!loading && tab === "Feedback" && feedback && <FeedbackTab feedback={feedback} />}
        {!loading && tab === "Reviews" && reviews && <ReviewsTab reviews={reviews} />}
      </div>
    </div>
  );
}

function DashboardTab({ stats }) {
  return (
    <div className="admin-section">
      <div className="admin-stats-grid">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Total Tasks" value={stats.totalTasks} />
        <StatCard label="Completed Tasks" value={stats.completedTasks} />
        <StatCard label="Feedback Received" value={stats.totalFeedback} />
        <StatCard label="Reviews" value={stats.totalReviews} />
        <StatCard label="Avg Rating" value={`${stats.averageRating}/5`} />
      </div>

      {stats.topServices?.length > 0 && (
        <div className="admin-card">
          <h3>Most Used Services</h3>
          <table className="admin-table">
            <thead><tr><th>Service</th><th>Tasks</th><th>Bar</th></tr></thead>
            <tbody>
              {stats.topServices.map(s => {
                const max = stats.topServices[0].taskCount;
                return (
                  <tr key={s.serviceCode}>
                    <td><Link to={`/service/${s.serviceCode.toLowerCase()}`}>{codeToName(s.serviceCode)}</Link></td>
                    <td>{s.taskCount}</td>
                    <td><div className="admin-bar"><div className="admin-bar-fill" style={{ width: `${(s.taskCount / max) * 100}%` }} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {stats.feedbackByType && Object.keys(stats.feedbackByType).length > 0 && (
        <div className="admin-card">
          <h3>Feedback by Type</h3>
          <div className="admin-chips">
            {Object.entries(stats.feedbackByType).map(([type, count]) => (
              <span key={type} className="admin-chip">{type.replace(/_/g, " ")}: {count}</span>
            ))}
          </div>
        </div>
      )}

      {stats.topFeedbackServices?.length > 0 && (
        <div className="admin-card">
          <h3>Services with Most Feedback</h3>
          <table className="admin-table">
            <thead><tr><th>Service</th><th>Feedback Count</th></tr></thead>
            <tbody>
              {stats.topFeedbackServices.map(s => (
                <tr key={s.serviceCode}>
                  <td><Link to={`/service/${s.serviceCode.toLowerCase()}`}>{codeToName(s.serviceCode)}</Link></td>
                  <td>{s.feedbackCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsersTab({ users }) {
  const [search, setSearch] = useState("");
  const filtered = (users.users || []).filter(u => u.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="admin-section">
      <div className="admin-card">
        <h3>Registered Users ({users.total})</h3>
        <input
          type="search"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="admin-search"
        />
        <div className="admin-user-list">
          {filtered.slice(0, 200).map(u => (
            <div key={u} className="admin-user-row">
              <span className="admin-user-avatar">{u.charAt(0).toUpperCase()}</span>
              <span>{u}</span>
            </div>
          ))}
          {filtered.length > 200 && <p className="admin-more">...and {filtered.length - 200} more</p>}
        </div>
      </div>
    </div>
  );
}

function FeedbackTab({ feedback }) {
  const [filter, setFilter] = useState("ALL");
  const types = ["ALL", ...new Set((feedback.feedback || []).map(f => f.type))];
  const list = filter === "ALL" ? feedback.feedback : feedback.feedback.filter(f => f.type === filter);
  return (
    <div className="admin-section">
      <div className="admin-card">
        <h3>All Feedback ({feedback.total})</h3>
        <div className="admin-filter-row">
          {types.map(t => (
            <button key={t} className={`admin-filter-btn ${filter === t ? "admin-filter-btn--active" : ""}`} onClick={() => setFilter(t)}>
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        {list.length === 0 && <p className="admin-empty">No feedback yet.</p>}
        {list.map(f => (
          <div key={f.id} className="admin-feedback-item">
            <div className="admin-feedback-meta">
              <span className={`admin-feedback-type admin-feedback-type--${f.type.toLowerCase()}`}>{f.type.replace(/_/g, " ")}</span>
              <Link to={`/service/${f.serviceCode.toLowerCase()}`}>{codeToName(f.serviceCode)}</Link>
              <span className="admin-feedback-user">by {f.username}</span>
              <span className="admin-feedback-time">{new Date(f.timestamp).toLocaleDateString()}</span>
            </div>
            <p>{f.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab({ reviews }) {
  return (
    <div className="admin-section">
      <div className="admin-card">
        <h3>All Reviews ({reviews.total}) — Average: {reviews.averageRating}/5</h3>
        {reviews.distribution && (
          <div className="admin-rating-dist">
            {[5, 4, 3, 2, 1].map(n => (
              <div key={n} className="admin-rating-row">
                <span>{n} star{n > 1 ? "s" : ""}</span>
                <div className="admin-bar"><div className="admin-bar-fill" style={{ width: `${((reviews.distribution[n] || 0) / Math.max(reviews.total, 1)) * 100}%` }} /></div>
                <span>{reviews.distribution[n] || 0}</span>
              </div>
            ))}
          </div>
        )}
        {(reviews.reviews || []).map(r => (
          <div key={r.id} className="admin-review-item">
            <div className="admin-review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
            <div className="admin-feedback-meta">
              <Link to={`/service/${r.serviceCode.toLowerCase()}`}>{codeToName(r.serviceCode)}</Link>
              <span className="admin-feedback-user">by {r.username}</span>
              <span className="admin-feedback-time">{new Date(r.timestamp).toLocaleDateString()}</span>
            </div>
            <p>{r.message}</p>
          </div>
        ))}
        {(reviews.reviews || []).length === 0 && <p className="admin-empty">No reviews yet.</p>}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  );
}
