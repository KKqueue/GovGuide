import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand-mark brand-mark--footer" aria-hidden="true">GG</span>
            <div>
              <p><strong>Government Guide Companion</strong></p>
              <p>An independent informational tool — not affiliated with the Government of India.</p>
            </div>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            <div className="footer-nav-group">
              <h4>Navigate</h4>
              <Link to="/">Home</Link>
              <Link to="/#services-section">Services</Link>
              <Link to="/#about">About</Link>
            </div>
            <div className="footer-nav-group">
              <h4>Account</h4>
              <Link to="/signin">Sign in</Link>
              <Link to="/signup">Create account</Link>
            </div>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>Always confirm current details on the official source before applying.</p>
          <p className="footer-meta">All information sourced from official government portals. Last updated: November 2026.</p>
        </div>
      </div>
    </footer>
  );
}
