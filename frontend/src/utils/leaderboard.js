const LEADERBOARD_KEY = "devops_quiz_leaderboard_v1";

const PRESEEDED_LEADERBOARD = [];

export function getLeaderboard() {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (!data) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(data);
    return sortLeaderboard(parsed);
  } catch (err) {
    console.error("Error reading leaderboard:", err);
    return [];
  }
}

function sortLeaderboard(list) {
  return [...list].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score; // Higher score wins
    }
    return a.timeTaken - b.timeTaken; // Faster time wins on tie
  });
}

export function saveQuizResult(newEntry) {
  const currentList = getLeaderboard();
  const entryToAdd = {
    id: `user-${Date.now()}`,
    username: newEntry.username || "Anonymous Engineer",
    score: newEntry.score,
    total: newEntry.total || 5,
    timeTaken: newEntry.timeTaken || 0,
    date: new Date().toISOString().split("T")[0],
    avatar: newEntry.avatar || "⚡",
    isCurrentUser: true
  };

  const updatedList = sortLeaderboard([...currentList, entryToAdd]);

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error("Error saving leaderboard entry:", err);
  }

  // Find exact position of this entry
  const rankIndex = updatedList.findIndex(item => item.id === entryToAdd.id);
  const rank = rankIndex !== -1 ? rankIndex + 1 : 1;

  return {
    entry: entryToAdd,
    rank,
    totalEntries: updatedList.length,
    leaderboard: updatedList
  };
}

export function getPerformanceBadge(score, total = 5) {
  const percentage = (score / total) * 100;
  if (percentage === 100) return { title: "DevOps Master", color: "#00f2fe", icon: "🏆", tag: "Flawless Score" };
  if (percentage >= 80) return { title: "Cloud Specialist", color: "#38ef7d", icon: "⚡", tag: "Excellent Performance" };
  if (percentage >= 60) return { title: "SysAdmin Specialist", color: "#4facfe", icon: "🛠️", tag: "Solid Knowledge" };
  if (percentage >= 40) return { title: "Junior Engineer", color: "#f12711", icon: "🌱", tag: "Keep Practicing" };
  return { title: "DevOps Cadet", color: "#ff8c00", icon: "📚", tag: "Needs Review" };
}
