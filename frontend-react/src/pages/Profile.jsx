import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { fetchTask, getSavedTaskIds } from "../api/services";
import { codeToName } from "../utils/serviceNames";

export default function Profile() {
  const { user, authHeader, signOut } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    document.title = `${user} — Government Guide`;
    return () => { document.title = "Government Guide Companion"; };
  }, [user, navigate]);

  useEffect(() => {
    if (!authHeader) return;
    setLoadingTasks(true);
    const saved = getSavedTaskIds();
    if (saved.length === 0) {
      setLoadingTasks(false);
      return;
    }
    Promise.all(
      saved.map(({ taskId, serviceCode }) =>
        fetchTask(taskId, authHeader)
          .then(t => t ? { ...t, serviceCode: t.serviceCode || serviceCode } : null)
          .catch(() => null)
      )
    ).then(results => {
      const valid = results.filter(Boolean);
      const byService = new Map();
      for (const t of valid) {
        byService.set(t.serviceCode, t);
      }
      setTasks([...byService.values()]);
      setLoadingTasks(false);
    });
  }, [authHeader]);

  if (!user) return null;

  const completed = tasks.filter(t => t.progressPercentage === 100).length;
  const inProgress = tasks.filter(t => t.progressPercentage > 0 && t.progressPercentage < 100).length;
  const totalItems = tasks.reduce((sum, t) => sum + (t.totalItems || 0), 0);
  const completedItems = tasks.reduce((sum, t) => sum + (t.completedItems || 0), 0);

  return (
    <div className="profile-page">
      <div className="shell">
        <div className="profile-card">
          <div className="profile-avatar" aria-hidden="true">
            {user.charAt(0).toUpperCase()}
          </div>
          <h2>{user}</h2>
          <p className="profile-role">Registered user</p>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-number">{tasks.length}</span>
              <span className="profile-stat-label">Services started</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-number">{inProgress}</span>
              <span className="profile-stat-label">In progress</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-number">{completed}</span>
              <span className="profile-stat-label">Completed</span>
            </div>
            {totalItems > 0 && (
              <div className="profile-stat">
                <span className="profile-stat-number">{Math.round((completedItems / totalItems) * 100)}%</span>
                <span className="profile-stat-label">Overall progress</span>
              </div>
            )}
          </div>

          {!loadingTasks && tasks.length > 0 && (
            <div className="profile-section">
              <h3>Your checklists</h3>
              <div className="profile-tasks">
                {tasks.map((task) => (
                  <Link
                    key={task.taskId}
                    to={`/service/${(task.serviceCode || "").toLowerCase()}`}
                    className="profile-task"
                  >
                    <div className="profile-task-info">
                      <span className="profile-task-name">{codeToName(task.serviceCode)}</span>
                      <span className="profile-task-progress">{task.progressPercentage || 0}%</span>
                    </div>
                    <div className="profile-task-bar">
                      <div
                        className="profile-task-bar-fill"
                        style={{ width: `${Math.min(task.progressPercentage || 0, 100)}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!loadingTasks && tasks.length === 0 && (
            <div className="profile-section">
              <h3>Your checklists</h3>
              <p className="profile-empty">No checklists started yet. Browse <Link to="/">services</Link> to begin.</p>
            </div>
          )}

          {loadingTasks && (
            <div className="profile-section">
              <p className="profile-empty">Loading your progress...</p>
            </div>
          )}

          <div className="profile-section">
            <h3>Account</h3>
            <div className="profile-field">
              <span className="profile-field-label">Username</span>
              <span className="profile-field-value">{user}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Checklist items</span>
              <span className="profile-field-value">{completedItems} / {totalItems}</span>
            </div>
          </div>

          <Link to="/admin" className="button button-primary" style={{ marginBottom: "1rem", display: "inline-block" }}>
            Admin Dashboard
          </Link>

          <button
            className="button button-secondary profile-signout"
            type="button"
            onClick={() => { signOut(); navigate("/"); }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
