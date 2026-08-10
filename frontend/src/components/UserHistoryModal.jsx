import React, { useState, useEffect } from "react";
import { History, X, Loader2, Calendar, Target } from "lucide-react";
import { getUserProfileApi, getUserHistoryApi } from "../services/api";
import { getPerformanceBadge } from "../utils/leaderboard";

export function UserHistoryModal({ isOpen, onClose, username, defaultAvatar }) {
  const [profile, setProfile] = useState(null);
  const [historyData, setHistoryData] = useState({ totalAttempts: 0, history: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && username) {
      setLoading(true);
      setError(null);
      Promise.all([
        getUserProfileApi(username),
        getUserHistoryApi(username)
      ])
        .then(([prof, hist]) => {
          setProfile(prof);
          if (hist) {
            setHistoryData(hist);
          }
        })
        .catch((err) => {
          setError(err.message || "Backend service is not working.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, username]);

  if (!isOpen) return null;

  const history = historyData.history || [];
  const totalAttempts = historyData.totalAttempts || history.length;

  // Calculate highest score & fastest time from history or profile
  const highestScore = history.length > 0 
    ? Math.max(...history.map(h => h.score || 0))
    : (profile?.highest_score || 0);

  const bestBadge = getPerformanceBadge(highestScore, 5);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="modal-header" style={{ marginBottom: "1.2rem" }}>
          <div className="hero-pill" style={{ margin: "0 auto 0.75rem auto" }}>
            <History size={14} /> Engineer Attempt Audit
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", marginTop: "0.5rem" }}>
            <span style={{ fontSize: "2.2rem" }}>{profile?.avatar || defaultAvatar || "⚡"}</span>
            <h2 className="modal-title" style={{ margin: 0 }}>{username || "Engineer"}</h2>
          </div>

          <div className="modal-subtitle" style={{ marginTop: "0.4rem" }}>
            {profile?.created_at ? (
              <span><Calendar size={13} style={{ display: "inline", marginRight: "4px" }} /> Active since {new Date(profile.created_at).toLocaleDateString()}</span>
            ) : (
              "Historical DevOps evaluation performance logs & metrics."
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <Loader2 size={32} className="spin-loader" style={{ margin: "0 auto 1rem auto" }} />
            <p>Fetching evaluation logs for {username}...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--accent-red, #ef4444)" }}>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.5rem" }}>⚠️ Backend Service Not Reachable</p>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{error}</p>
          </div>
        ) : (
          <div>
            {/* Engineer Key Metrics */}
            <div className="stats-grid" style={{ marginBottom: "1.25rem" }}>
              <div className="stat-box">
                <div className="stat-value">{totalAttempts}</div>
                <div className="stat-label">Evaluations Taken</div>
              </div>

              <div className="stat-box">
                <div className="stat-value" style={{ color: "var(--accent-sage)" }}>
                  {highestScore} / 5
                </div>
                <div className="stat-label">Highest Score</div>
              </div>

              <div className="stat-box">
                <div className="stat-value" style={{ color: "var(--accent-gold-dark)", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                  <span>{bestBadge.icon}</span> {bestBadge.title}
                </div>
                <div className="stat-label">Top Performance Badge</div>
              </div>
            </div>

            {/* History Logs Table */}
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Target size={16} color="var(--accent-gold)" /> Performance Logs
              </div>

              <div style={{ maxHeight: "260px", overflowY: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border-glass)" }}>
                {history.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    No recorded quiz evaluations yet for this engineer.
                  </div>
                ) : (
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th>Attempt Date</th>
                        <th>Score</th>
                        <th>Accuracy</th>
                        <th>Time</th>
                        <th>Badge Title</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, idx) => {
                        const itemBadge = getPerformanceBadge(item.score, item.total || 5);
                        const percentage = item.percentage !== undefined ? item.percentage : Math.round(((item.score || 0) / (item.total || 5)) * 100);

                        return (
                          <tr key={item.result_id || item.id || idx} className="leaderboard-row">
                            <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                              {item.date || (item.created_at ? item.created_at.split("T")[0] : "Recent")}
                            </td>
                            <td>
                              <strong style={{ color: "var(--accent-sage)" }}>
                                {item.score} / {item.total || 5}
                              </strong>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600 }}>{percentage}%</span>
                            </td>
                            <td>{item.timeTaken || item.time_taken_seconds || 0}s</td>
                            <td>
                              <span style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.55rem", borderRadius: "var(--radius-full)", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border-glass)" }}>
                                <span>{itemBadge.icon}</span> {itemBadge.title}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
