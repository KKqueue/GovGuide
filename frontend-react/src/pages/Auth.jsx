import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: "var(--error-text)" };
  if (score <= 2) return { score: 2, label: "Fair", color: "#D97706" };
  if (score <= 3) return { score: 3, label: "Good", color: "#2563EB" };
  return { score: 4, label: "Strong", color: "var(--accent)" };
}

export default function Auth({ tab: initialTab = "signin" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/";
  const sessionExpired = location.state?.sessionExpired;

  useEffect(() => {
    if (user) { navigate(returnTo, { replace: true }); return; }
    document.title = activeTab === "signup" ? "Sign Up — Government Guide" : "Sign In — Government Guide";
    if (sessionExpired && activeTab === "signin" && !status) setStatus("Your session has expired. Please sign in again.");
    return () => { document.title = "Government Guide Companion"; };
  }, [user, navigate, activeTab]);

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      await signIn(username, password);
      showToast("Signed in successfully!", "success");
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
      setStatus("Username can only contain letters, numbers, dots, hyphens, and underscores.");
      return;
    }
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setStatus("Password must be at least 8 characters with at least one letter and one number.");
      return;
    }
    if (password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await signUp(username, password);
      showToast("Account created! Welcome to GovGuide.", "success");
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
  }

  return (
    <div className="auth-page">
      <div className="shell">
        <div className="auth-page-inner">
          <h2>{activeTab === "signin" ? "Sign In" : "Sign Up"}</h2>
          <p className="auth-page-subtitle">
            {activeTab === "signin"
              ? "Sign in to save your checklist progress."
              : "Create a new account to get started."}
          </p>

          {activeTab === "signin" ? (
            <form className="auth-form" onSubmit={handleSignIn}>
              <label>
                <span>Username</span>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <div className="auth-actions">
                <button className="button button-primary" type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </div>
              <p className="auth-status" role="alert">{status || " "}</p>
              <p className="auth-switch">
                Don't have an account?{" "}
                <button type="button" className="link-button" onClick={() => switchTab("signup")}>Sign up</button>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignUp}>
              <label>
                <span>Username</span>
                <input
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="e.g. mahavishnu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <span className="auth-hint">Letters, numbers, dots, hyphens, underscores only.</span>
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {password && (() => {
                  const s = getPasswordStrength(password);
                  return (
                    <div className="password-strength">
                      <div className="password-strength-bar">
                        <div className="password-strength-fill" style={{ width: `${s.score * 25}%`, background: s.color }} />
                      </div>
                      <span className="password-strength-label" style={{ color: s.color }}>{s.label}</span>
                    </div>
                  );
                })()}
                <span className="auth-hint">Min 8 characters, one letter and one number.</span>
              </label>
              <label>
                <span>Confirm Password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
              <div className="auth-actions">
                <button className="button button-primary" type="submit" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </div>
              <p className="auth-status" role="alert">{status || " "}</p>
              <p className="auth-switch">
                Already have an account?{" "}
                <button type="button" className="link-button" onClick={() => switchTab("signin")}>Sign in</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
