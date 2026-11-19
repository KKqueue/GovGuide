import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useToast } from "../components/Toast";

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, key: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, key: "pw_weak", color: "var(--error-text)" };
  if (score <= 2) return { score: 2, key: "pw_fair", color: "#D97706" };
  if (score <= 3) return { score: 3, key: "pw_good", color: "#2563EB" };
  return { score: 4, key: "pw_strong", color: "var(--accent)" };
}

export default function Auth({ tab: initialTab = "signin" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const returnTo = location.state?.returnTo || "/";
  const sessionExpired = location.state?.sessionExpired;

  useEffect(() => {
    if (user) { navigate(returnTo, { replace: true }); return; }
    document.title = activeTab === "signup" ? `${t("auth_sign_up")} — ${t("app_name")}` : `${t("auth_sign_in")} — ${t("app_name")}`;
    if (sessionExpired && activeTab === "signin" && !status) setStatus(t("session_expired_msg"));
    return () => { document.title = t("app_name"); };
  }, [user, navigate, activeTab]);

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      await signIn(username, password);
      showToast(t("signed_in_toast"), "success");
      navigate(returnTo, { replace: true });
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      setStatus(t("username_invalid_msg"));
      return;
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setStatus(t("password_requirements_msg"));
      return;
    }
    if (password !== confirm) {
      setStatus(t("passwords_no_match"));
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await signUp(username, password);
      showToast(t("account_created_toast"), "success");
      navigate(returnTo, { replace: true });
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchTab(tab) {
    setActiveTab(tab);
    setStatus("");
    setUsername("");
    setPassword("");
    setConfirm("");
    setShowPassword(false);
    setShowConfirm(false);
  }

  return (
    <div className="auth-page">
      <div className="shell">
        <div className="auth-page-inner">
          <h2>{activeTab === "signin" ? t("auth_sign_in") : t("auth_sign_up")}</h2>
          <p className="auth-page-subtitle">
            {activeTab === "signin"
              ? t("sign_in_prompt")
              : t("sign_up_prompt")}
          </p>

          {activeTab === "signin" ? (
            <form className="auth-form" onSubmit={handleSignIn}>
              <label>
                <span>{t("username")}</span>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
              <label>
                <span>{t("password")}</span>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? t("hide_password") : t("show_password")}>
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </label>
              <div className="auth-actions">
                <button className="button button-primary" type="submit" disabled={loading}>
                  {loading ? t("signing_in") : t("auth_sign_in")}
                </button>
              </div>
              <p className="auth-status" role="alert">{status || " "}</p>
              <p className="auth-switch">
                {t("no_account")}{" "}
                <button type="button" className="link-button" onClick={() => switchTab("signup")}>{t("sign_up_link")}</button>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignUp}>
              <label>
                <span>{t("username")}</span>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="e.g. mahavishnu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <span className="auth-hint">{t("auth_hint_username")}</span>
              </label>
              <label>
                <span>{t("password")}</span>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? t("hide_password") : t("show_password")}>
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                {password && (() => {
                  const s = getPasswordStrength(password);
                  return (
                    <div className="password-strength">
                      <div className="password-strength-bar">
                        <div className="password-strength-fill" style={{ width: `${s.score * 25}%`, background: s.color }} />
                      </div>
                      <span className="password-strength-label" style={{ color: s.color }}>{t(s.key)}</span>
                    </div>
                  );
                })()}
                <span className="auth-hint">{t("auth_hint_password")}</span>
              </label>
              <label>
                <span>{t("confirm_password")}</span>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? t("hide_password") : t("show_password")}>
                    {showConfirm ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </label>
              <div className="auth-actions">
                <button className="button button-primary" type="submit" disabled={loading}>
                  {loading ? t("creating_account") : t("create_account")}
                </button>
              </div>
              <p className="auth-status" role="alert">{status || " "}</p>
              <p className="auth-switch">
                {t("have_account")}{" "}
                <button type="button" className="link-button" onClick={() => switchTab("signin")}>{t("sign_in_link")}</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
