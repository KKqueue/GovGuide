import { useState } from "react";
import { submitReview } from "../api/services";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "./Toast";

export default function ReviewModal({ serviceCode, taskId, onDone }) {
  const { authHeader } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0 || !message.trim()) return;
    setSending(true);
    try {
      await submitReview(serviceCode, taskId, rating, message.trim(), authHeader);
      showToast("Review submitted. Thank you!", "success");
      onDone();
    } catch {
      showToast("Could not submit review. Please try again.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card" role="dialog" aria-label="Rate this service">
        <div className="modal-header">
          <h3>Rate your experience</h3>
        </div>
        <p className="modal-subtitle">You completed all checklist items. Please rate this service to help others.</p>
        <form onSubmit={handleSubmit}>
          <div className="star-rating" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                className={`star ${n <= (hover || rating) ? "star--filled" : ""}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                <svg viewBox="0 0 24 24" fill={n <= (hover || rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
          </div>
          {rating === 0 && <p className="modal-hint">Please select a rating</p>}
          <label className="modal-label">
            Your feedback
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="How was your experience? Any suggestions to improve?"
              rows={3}
              maxLength={2000}
              required
            />
          </label>
          <div className="modal-actions">
            <button type="submit" className="button button-primary" disabled={sending || rating === 0 || !message.trim()}>
              {sending ? "Submitting..." : "Submit review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
