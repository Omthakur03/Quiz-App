import { getRandomQuiz as getLocalQuiz } from "../data/questions";
import { getLeaderboard as getLocalLeaderboard, saveQuizResult as saveLocalResult } from "../utils/leaderboard";

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || "https://api.quiz.mzsk.fun/api";
const GATEWAY_HOST = API_BASE_URL.replace(/\/api\/?$/, "");

// Helper for pinging backend health
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${GATEWAY_HOST}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      return data.gateway === "UP";
    }
  } catch (err) {
    // API Gateway offline
  }
  return false;
}

// User Registration
export async function registerUserApi(userInfo) {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userInfo),
      signal: AbortSignal.timeout(3000)
    });
    if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Username is already taken. Please choose a different username.");
    }
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch (err) {
    if (err.message && err.message.includes("already taken")) {
      throw err;
    }
    console.warn("Backend API unavailable, using local session:", err.message);
  }
  return {
    user_id: `local_${Date.now()}`,
    username: userInfo.username,
    avatar: userInfo.avatar || "⚡"
  };
}

// Fetch Random 5-Question Quiz Assessment
export async function getRandomQuizApi(count = 5) {
  try {
    const res = await fetch(`${API_BASE_URL}/quizzes/random?count=${count}`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        return data.questions;
      }
    }
  } catch (err) {
    console.warn("Backend API unavailable, using local questions:", err.message);
  }
  return getLocalQuiz(count);
}

// Evaluate Quiz Answers
export async function submitQuizAnswersApi(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/quizzes/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API submit failed, evaluating locally:", err.message);
  }

  // Local fallback evaluation
  let score = 0;
  const answerBreakdown = payload.questions.map((q, idx) => {
    const selected = payload.selectedAnswers[idx];
    const isCorrect = selected === q.correct;
    if (isCorrect) score += 1;
    return {
      question: q.question,
      category: q.category,
      options: q.options,
      selectedOption: selected !== undefined ? selected : null,
      correctOption: q.correct,
      isCorrect,
      explanation: q.explanation || "No explanation provided."
    };
  });

  return {
    score,
    total: payload.questions.length,
    percentage: Math.round((score / payload.questions.length) * 100),
    timeTaken: payload.timeTaken,
    answers: answerBreakdown
  };
}

// Save Quiz Result & Get Leaderboard Standing
export async function saveQuizResultApi(resultData) {
  try {
    const res = await fetch(`${API_BASE_URL}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultData),
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API result save failed, saving locally:", err.message);
  }

  return saveLocalResult(resultData);
}

// Fetch Global Leaderboard
export async function getLeaderboardApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/leaderboard`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.leaderboard && data.leaderboard.length > 0) {
        return data.leaderboard;
      }
    }
  } catch (err) {
    console.warn("Backend API leaderboard fetch failed, returning local leaderboard:", err.message);
  }

  return getLocalLeaderboard();
}

// Get User Profile Metadata (User Service: GET /api/v1/users/:username)
export async function getUserProfileApi(username) {
  if (!username) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch (err) {
    console.warn("Backend API getUserProfile failed:", err.message);
  }
  return null;
}

// Get User Quiz Attempt History (Result Service: GET /api/v1/results/user/:username)
export async function getUserHistoryApi(username) {
  if (!username) return { username, totalAttempts: 0, history: [] };
  try {
    const res = await fetch(`${API_BASE_URL}/results/user/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API getUserHistory failed:", err.message);
  }
  return { username, totalAttempts: 0, history: [] };
}

