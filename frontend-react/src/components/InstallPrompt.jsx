import { useState, useEffect } from "react";

let deferredPrompt = null;

export default function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function handler(e) {
      e.preventDefault();
      deferredPrompt = e;
      try {
        const dismissed = sessionStorage.getItem("govguide-install-dismissed");
        if (!dismissed) setShow(true);
      } catch {
        setShow(true);
      }
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
        setShow(false);
      });
    }
  }

  function dismiss() {
    setShow(false);
    try { sessionStorage.setItem("govguide-install-dismissed", "1"); } catch {}
  }

  if (!show) return null;

  return (
    <div className="install-banner" role="banner">
      <div className="install-banner-inner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Install GovGuide for quick offline access</span>
        <button className="button button-primary install-banner-btn" type="button" onClick={install}>Install</button>
        <button className="install-banner-close" type="button" aria-label="Dismiss" onClick={dismiss}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </div>
  );
}
