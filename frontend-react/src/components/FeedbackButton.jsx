import { useState } from "react";
import { submitFeedback } from "../api/services";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useToast } from "./Toast";

export default function FeedbackButton({ serviceCode }) {
  const { user, authHeader } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("BUG");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const types = [
    { value: "BUG", label: t("feedback_bug") },
    { value: "INCORRECT_INFO", label: t("feedback_incorrect") },
    { value: "MISSING_INFO", label: t("feedback_missing") },
    { value: "SUGGESTION", label: t("feedback_suggestion") },
    { value: "OTHER", label: t("feedback_other") },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await submitFeedback(serviceCode, type, message.trim(), authHeader);
      showToast(t("feedback_sent_toast"), "success");
      setOpen(false);
      setMessage("");
      setType("BUG");
    } catch {
      showToast(t("feedback_error_toast"), "error");
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <>
      <button
        className="feedback-fab"
        type="button"
        aria-label={t("send_feedback_aria")}
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {t("feedback")}
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} role="dialog" aria-label={t("service_feedback")}>
            <div className="modal-header">
              <h3>{t("service_feedback")}</h3>
              <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label={t("close")}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="modal-label">
                {t("issue_type")}
                <select value={type} onChange={e => setType(e.target.value)}>
                  {types.map(tp => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
                </select>
              </label>
              <label className="modal-label">
                {t("your_message")}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t("feedback_placeholder")}
                  rows={4}
                  maxLength={2000}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={() => setOpen(false)}>{t("cancel")}</button>
                <button type="submit" className="button button-primary" disabled={sending || !message.trim()}>
                  {sending ? t("sending") : t("submit_feedback")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
