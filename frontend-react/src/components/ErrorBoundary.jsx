import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="shell" style={{ padding: "80px 0" }}>
          <div className="state-panel state-error" role="alert">
            <strong>Something went wrong</strong>
            <p>An unexpected error occurred. Please refresh the page.</p>
            <button
              className="button button-primary"
              type="button"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
