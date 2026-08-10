import React from "react";
import { Terminal, Trophy } from "lucide-react";

export function Navbar({ user, onOpenLeaderboard, onOpenUserHistory }) {
  return (
    <header className="navbar">
      <div className="brand-logo">
        <div className="logo-badge">
          <Terminal size={18} color="#ffffff" />
        </div>
        <span>DevOps<span className="brand-serif">Quiz</span></span>
      </div>

      <div className="nav-actions">
        {user && (
          <button
            className="btn-secondary-pill"
            onClick={() => onOpenUserHistory && onOpenUserHistory(user.username)}
            title="View My History"
          >
            <span style={{ marginRight: "0.2rem" }}>{user.avatar || "⚡"}</span>
            <strong>{user.username}</strong>
          </button>
        )}

        <button className="btn-secondary-pill" onClick={onOpenLeaderboard}>
          <Trophy size={16} color="var(--accent-gold)" />
          <span>Rankings</span>
        </button>
      </div>
    </header>
  );
}

