import React, { useState, useEffect, useRef } from "react";
import { User, Sparkles, X, ArrowRight, Loader2 } from "lucide-react";

const AVATARS = ["⚡", "🚀", "🥷", "🐳", "🏗️", "🛡️"];

export function UsernameModal({ isOpen, onClose, onSubmitUsername }) {
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("⚡");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a username to start the quiz");
      return;
    }
    if (trimmed.length < 2) {
      setError("Username must be at least 2 characters long");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmitUsername({ username: trimmed, avatar: selectedAvatar });
    } catch (err) {
      setError(err.message || "Username is already taken. Please choose a different username.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="modal-header">
          <div className="hero-pill" style={{ margin: "0 auto 1rem auto" }}>
            <Sparkles size={14} /> Ready for the Challenge?
          </div>
          <h2 className="modal-title">Enter Your Name</h2>
          <p className="modal-subtitle">
            Enter your handle to start your 5-question DevOps quiz and get placed on the global ranking leaderboard!
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="avatar-selector-label">Choose Avatar</label>
            <div className="avatar-grid">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av}
                  className={`avatar-btn ${selectedAvatar === av ? "selected" : ""}`}
                  onClick={() => setSelectedAvatar(av)}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Username / Handle</label>
            <div style={{ position: "relative" }}>
              <input
                ref={inputRef}
                type="text"
                className="text-input"
                placeholder="e.g. CloudPioneer99"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError("");
                }}
                maxLength={24}
              />
              <User
                size={18}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-dim)"
                }}
              />
            </div>
            {error && (
              <p style={{ color: "var(--accent-red)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                {error}
              </p>
            )}
          </div>

          <button type="submit" className="btn-glow-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin-loader" />
                <span>Registering & Preparing...</span>
              </>
            ) : (
              <>
                <span>Start 5-Question Quiz</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
