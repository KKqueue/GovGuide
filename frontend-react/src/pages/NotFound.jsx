import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page Not Found — Government Guide";
    return () => { document.title = "Government Guide Companion"; };
  }, []);

  return (
    <div className="not-found-page">
      <div className="shell">
        <div className="state-panel">
          <strong>Page not found</strong>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <Link className="button button-primary" to="/">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
