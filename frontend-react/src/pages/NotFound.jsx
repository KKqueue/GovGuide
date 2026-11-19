import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";

export default function NotFound() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = "Page Not Found — Government Guide";
    return () => { document.title = "Government Guide Companion"; };
  }, []);

  return (
    <div className="not-found-page">
      <div className="shell">
        <div className="state-panel">
          <strong>{t("page_not_found")}</strong>
          <p>{t("page_not_found_msg")}</p>
          <Link className="button button-primary" to="/">{t("back_home")}</Link>
        </div>
      </div>
    </div>
  );
}
