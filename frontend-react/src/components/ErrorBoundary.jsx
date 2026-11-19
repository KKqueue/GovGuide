import { Component } from "react";
import { translate } from "../i18n/translations";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const lang = localStorage.getItem("govguide-lang") || "en";
      return (
        <div className="shell" style={{ padding: "80px 0" }}>
          <div className="state-panel state-error" role="alert">
            <strong>{translate(lang, "something_wrong")}</strong>
            <p>{translate(lang, "unexpected_error")}</p>
            <button
              className="button button-primary"
              type="button"
              onClick={() => window.location.reload()}
            >
              {translate(lang, "refresh_page")}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
