import { useState } from "react";
import { submitFeedback } from "../api/services";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "./Toast";

const TYPES = [
  { value: "BUG", label: "Something is broken" },
  { value: "INCORRECT_INFO", label: "Incorrect information" },
  { value: "MISSING_INFO", label: "Missing information" },
  { value: "SUGGESTION", label: "Suggestion" },
  { value: "OTHER", label: "Other" },
];

export default function FeedbackButton({ serviceCode }) {
  const { user, authHeader } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("BUG");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await submitFeedback(serviceCode, type, message.trim(), authHeader);
      showToast("Feedback submitted. Thank you!", "success");
      setOpen(false);
      setMessage("");
      setType("BUG");
    } catch {
      showToast("Could not submit feedback. Please try again.", "error");
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
        aria-label="Send feedback about this service"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} role="dialog" aria-label="Submit feedback">
            <div className="modal-header">
              <h3>Service Feedback</h3>
              <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Close">&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="modal-label">
                Issue type
                <select value={type} onChange={e => setType(e.target.value)}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label className="modal-label">
                Your message
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe the issue or suggestion..."
                  rows={4}
                  maxLength={2000}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="button button-primary" disabled={sending || !message.trim()}>
                  {sending ? "Sending..." : "Submit feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
