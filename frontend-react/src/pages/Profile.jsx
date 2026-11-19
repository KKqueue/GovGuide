import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
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

  const { t } = useLanguage();

  if (!user) return null;

  const completed = tasks.filter(t => t.progressPercentage === 100).length;
  const inProgress = tasks.filter(t => t.progressPercentage > 0 && t.progressPercentage < 100).length;
  const notStarted = tasks.filter(t => !t.progressPercentage || t.progressPercentage === 0).length;
  const totalItems = tasks.reduce((sum, t) => sum + (t.totalItems || 0), 0);
  const completedItems = tasks.reduce((sum, t) => sum + (t.completedItems || 0), 0);

  function taskStatus(task) {
    const p = task.progressPercentage || 0;
    if (p === 100) return { label: t("profile_completed"), cls: "profile-task-status--done" };
    if (p > 0) return { label: t("profile_in_progress"), cls: "profile-task-status--active" };
    return { label: t("status_not_reviewed"), cls: "profile-task-status--new" };
  }

  return (
    <div className="profile-page">
      <div className="shell">
        <div className="profile-card">
          <div className="profile-avatar" aria-hidden="true">
            {user.charAt(0).toUpperCase()}
          </div>
          <h2>{user}</h2>
          <p className="profile-role">Registered user</p>

          <div className="profile-overview" role="region" aria-label="Your progress overview">
            <div className="profile-overview-card">
              <span className="number">{tasks.length}</span>
              <span className="label">{t("services_started")}</span>
            </div>
            <div className="profile-overview-card">
              <span className="number">{inProgress}</span>
              <span className="label">{t("profile_in_progress")}</span>
            </div>
            <div className="profile-overview-card">
              <span className="number">{completed}</span>
              <span className="label">{t("profile_completed")}</span>
            </div>
            <div className="profile-overview-card">
              <span className="number">{totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%</span>
              <span className="label">{t("overall_progress")}</span>
            </div>
          </div>

          {totalItems > 0 && (
            <div className="profile-task-bar" style={{ marginBottom: 20 }}>
              <div
                className="profile-task-bar-fill"
                style={{ width: `${Math.min(Math.round((completedItems / totalItems) * 100), 100)}%` }}
                role="progressbar"
                aria-valuenow={Math.round((completedItems / totalItems) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t("overall_progress")}
              />
            </div>
          )}

          <div className="profile-quick-actions">
            <Link to="/#services-section" className="button button-primary">{t("explore_services")}</Link>
          </div>

          {!loadingTasks && tasks.length > 0 && (
            <div className="profile-section">
              <h3>{t("your_checklists")}</h3>
              <div className="profile-tasks">
                {tasks.map((task) => {
                  const st = taskStatus(task);
                  return (
                    <Link
                      key={task.taskId}
                      to={`/service/${(task.serviceCode || "").toLowerCase()}`}
                      className="profile-task"
                    >
                      <div className="profile-task-info">
                        <span className="profile-task-name">{codeToName(task.serviceCode)}</span>
                        <span className={`profile-task-status ${st.cls}`}>{st.label}</span>
                        <span className="profile-task-progress">{task.progressPercentage || 0}%</span>
                      </div>
                      <div className="profile-task-bar">
                        <div
                          className="profile-task-bar-fill"
                          style={{ width: `${Math.min(task.progressPercentage || 0, 100)}%` }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {!loadingTasks && tasks.length === 0 && (
            <div className="profile-section">
              <h3>{t("your_checklists")}</h3>
              <p className="profile-empty">{t("no_checklists")} <Link to="/">{t("services")}</Link></p>
            </div>
          )}

          {loadingTasks && (
            <div className="profile-section">
              <p className="profile-empty">{t("loading")}</p>
            </div>
          )}

          <div className="profile-section">
            <h3>{t("account")}</h3>
            <div className="profile-field">
              <span className="profile-field-label">{t("profile_username")}</span>
              <span className="profile-field-value">{user}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">{t("checklist_items")}</span>
              <span className="profile-field-value">{completedItems} / {totalItems}</span>
            </div>
          </div>

          <Link to="/admin" className="button button-primary" style={{ marginBottom: "1rem", display: "inline-block" }}>
            {t("admin_dashboard")}
          </Link>

          <button
            className="button button-secondary profile-signout"
            type="button"
            onClick={() => { if (window.confirm("Are you sure you want to sign out?")) { signOut(); navigate("/"); } }}
          >
            {t("sign_out")}
          </button>
        </div>
      </div>
    </div>
  );
}
