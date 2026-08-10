import React, { useState, useEffect } from "react";
import { X, Flame, Loader2 } from "lucide-react";
import { getLeaderboardApi } from "../services/api";

export function LeaderboardModal({ isOpen, onClose, onSelectEngineer }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      getLeaderboardApi()
        .then((data) => setLeaderboard(data || []))
        .catch((err) => setError(err.message || "Backend service is not working."))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="modal-header">
          <div className="hero-pill" style={{ background: "var(--accent-gold-light)", borderColor: "var(--accent-gold-border)", color: "var(--accent-gold-dark)", margin: "0 auto 1rem auto" }}>
            <Flame size={14} /> Global Leaderboard
          </div>
          <h2 className="modal-title">Hall of Fame Rankings</h2>
          <p className="modal-subtitle">
            Top DevOps & Cloud Engineers ranked by highest accuracy and fastest quiz completion speed. Click any engineer to view performance history.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <Loader2 size={32} className="spin-loader" style={{ margin: "0 auto 1rem auto" }} />
            <p>Loading leaderboard rankings...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--accent-red, #ef4444)" }}>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.5rem" }}>⚠️ Backend Service Not Reachable</p>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{error}</p>
          </div>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Engineer</th>
                  <th>Score</th>
                  <th>Time</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((item, idx) => {
                  const itemRank = idx + 1;
                  let rankClass = "other";
                  if (itemRank === 1) rankClass = "top-1";
                  if (itemRank === 2) rankClass = "top-2";
                  if (itemRank === 3) rankClass = "top-3";

                  return (
                    <tr
                      key={item.id || idx}
                      className="leaderboard-row"
                      style={{ cursor: onSelectEngineer ? "pointer" : "default" }}
                      onClick={() => onSelectEngineer && onSelectEngineer(item.username, item.avatar)}
                      title="Click to view engineer history"
                    >
                      <td>
                        <span className={`rank-pill ${rankClass}`}>{itemRank}</span>
                      </td>
                      <td>
                        <span style={{ marginRight: "0.5rem" }}>{item.avatar || "⚡"}</span>
                        <strong style={{ color: "var(--text-primary)" }}>{item.username}</strong>
                      </td>
                      <td>
                        <strong style={{ color: "var(--accent-gold-dark)" }}>
                          {item.score} / {item.total || 5}
                        </strong>
                      </td>
                      <td>{item.timeTaken}s</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{item.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

