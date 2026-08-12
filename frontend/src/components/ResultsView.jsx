import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Trophy, RotateCcw, Share2, CheckCircle, XCircle, X, FileText, History } from "lucide-react";
import { getPerformanceBadge } from "../utils/leaderboard";

export function ResultsView({ resultData, user, onRetakeQuiz, onOpenHistory }) {
  const { score, total, timeTaken, answers, rank, leaderboard } = resultData;
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const percentage = Math.round((score / total) * 100);
  const badge = getPerformanceBadge(score, total);

  useEffect(() => {
    if (percentage >= 80) {
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
      } catch (err) {
        console.error("Confetti error:", err);
      }
    }
  }, [percentage]);

  const handleShare = () => {
    const text = `🏆 I scored ${score}/${total} (${percentage}%) on the DevOps Quiz and ranked #${rank}! Test your DevOps skills too!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel results-dashboard-fit">
      <div>
        {/* Header */}
        <div className="result-badge-container">
          <div className="result-avatar">{user.avatar}</div>
          <div>
            <div
              className="hero-pill"
              style={{ margin: 0, padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
            >
              {badge.icon} {badge.tag}
            </div>
            <h1 className="performance-title">{badge.title}</h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-value">{percentage}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: "var(--accent-sage)" }}>
              {score} / {total}
            </div>
            <div className="stat-label">Score</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: "var(--accent-violet-muted)" }}>
              {timeTaken}s
            </div>
            <div className="stat-label">Time Elapsed</div>
          </div>
        </div>

        {/* Rank Banner */}
        <div className="rank-banner">
          <div>
            <div className="rank-title">Leaderboard Standing</div>
            <div className="rank-highlight">
              Rank #{rank} <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "var(--text-muted)" }}>of {leaderboard.length} Engineers</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn-secondary-pill" onClick={() => setIsReviewOpen(true)}>
              <FileText size={15} />
              <span>Review Answers</span>
            </button>

            {user?.username && onOpenHistory && (
              <button className="btn-secondary-pill" onClick={() => onOpenHistory(user.username, user.avatar)}>
                <History size={15} />
                <span>My History</span>
              </button>
            )}

            <button className="btn-secondary-pill" onClick={handleShare}>
              <Share2 size={15} />
              <span>{copied ? "Copied!" : "Share"}</span>
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-main)" }}>
            <Trophy size={16} color="var(--accent-gold)" /> Leaderboard Rankings
          </div>

          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
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
                {leaderboard.slice(0, 6).map((item, idx) => {
                  const itemRank = idx + 1;
                  const isUser = item.id === resultData.entry.id;
                  let rankClass = "other";
                  if (itemRank === 1) rankClass = "top-1";
                  if (itemRank === 2) rankClass = "top-2";
                  if (itemRank === 3) rankClass = "top-3";

                  return (
                    <tr key={item.id || idx} className={`leaderboard-row ${isUser ? "current-user" : ""}`}>
                      <td>
                        <span className={`rank-pill ${rankClass}`}>{itemRank}</span>
                      </td>
                      <td>
                        <span style={{ marginRight: "0.4rem" }}>{item.avatar || "⚡"}</span>
                        <strong style={{ color: isUser ? "var(--accent-gold-dark)" : "var(--text-primary)" }}>
                          {item.username} {isUser && "(You)"}
                        </strong>
                      </td>
                      <td>
                        <strong style={{ color: "var(--accent-gold-dark)" }}>
                          {item.score} / {item.total || 5}
                        </strong>
                      </td>
                      <td>{item.timeTaken}s</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{item.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Retake Button Footer */}
      <div style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--border-glass)", display: "flex", justifyContent: "center" }}>
        <button className="btn-glow-primary" style={{ padding: "0.7rem 2.2rem", fontSize: "0.95rem" }} onClick={onRetakeQuiz}>
          <RotateCcw size={16} />
          <span>Retake Quiz</span>
        </button>
      </div>

      {/* Answer Review Modal */}
      {isReviewOpen && (
        <div className="modal-overlay" onClick={() => setIsReviewOpen(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "650px", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsReviewOpen(false)}>
              <X size={18} />
            </button>

            <h3 className="modal-title" style={{ textAlign: "left", marginBottom: "1rem" }}>
              Answer Review Breakdown
            </h3>

            <div>
              {answers.map((item, idx) => {
                const userChoiceText = (item.options && item.selectedOption !== null && item.selectedOption !== undefined) 
                  ? item.options[item.selectedOption] 
                  : "Skipped";
                const correctChoiceText = (item.options && item.correctOption !== undefined)
                  ? item.options[item.correctOption]
                  : "N/A";

                return (
                  <div key={idx} className={`review-card ${item.isCorrect ? "correct-card" : "wrong-card"}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--accent-gold-dark)", fontWeight: 700 }}>
                        {item.category || "DevOps"}
                      </span>
                      {item.isCorrect ? (
                        <span style={{ color: "#059669", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <CheckCircle size={15} /> Correct
                        </span>
                      ) : (
                        <span style={{ color: "#dc2626", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <XCircle size={15} /> Incorrect
                        </span>
                      )}
                    </div>

                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                      {idx + 1}. {item.question}
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "#334155", marginBottom: "0.25rem" }}>
                      <strong style={{ color: "#1e293b" }}>Your Answer:</strong>{" "}
                      <span style={{ color: item.isCorrect ? "#059669" : "#dc2626", fontWeight: 600 }}>
                        {userChoiceText}
                      </span>
                    </div>

                    {!item.isCorrect && (
                      <div style={{ fontSize: "0.85rem", color: "#059669", marginBottom: "0.25rem" }}>
                        <strong style={{ color: "#1e293b" }}>Correct Answer:</strong>{" "}
                        <span style={{ fontWeight: 600 }}>{correctChoiceText}</span>
                      </div>
                    )}

                    {item.explanation && (
                      <div className="review-explanation">
                        💡 <strong style={{ color: "#0f172a" }}>Explanation:</strong> {item.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
