import { Link } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand-mark brand-mark--footer" aria-hidden="true">GG</span>
            <div>
              <p><strong>{t("footer_title")}</strong></p>
              <p>{t("footer_subtitle")}</p>
            </div>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            <div className="footer-nav-group">
              <h4>{t("navigate")}</h4>
              <Link to="/">{t("home")}</Link>
              <Link to="/#services-section">{t("services")}</Link>
              <Link to="/#about">{t("about")}</Link>
            </div>
            <div className="footer-nav-group">
              <h4>{t("account")}</h4>
              <Link to="/signin">{t("sign_in")}</Link>
              <Link to="/signup">{t("create_account")}</Link>
            </div>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>{t("footer_disclaimer")}</p>
          <p className="footer-meta">{t("footer_meta")}</p>
        </div>
      </div>
    </footer>
  );
}
