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
      signal: AbortSignal.timeout(4000)
    });
    if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Username is already taken. Please choose a different username.");
    }
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Backend service error (${res.status}). Backend is not working.`);
  } catch (err) {
    if (err.message && (err.message.includes("already taken") || err.message.includes("Backend"))) {
      throw err;
    }
    throw new Error("Backend service is not working. Please check if backend services are deployed and running.");
  }
}

// Fetch Random 5-Question Quiz Assessment
export async function getRandomQuizApi(count = 5) {
  try {
    const res = await fetch(`${API_BASE_URL}/quizzes/random?count=${count}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        return data.questions;
      }
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Backend service error (${res.status}). Backend is not working.`);
  } catch (err) {
    if (err.message && err.message.includes("Backend")) {
      throw err;
    }
    throw new Error("Backend service is not working. Unable to fetch questions from backend API.");
  }
}

// Evaluate Quiz Answers
export async function submitQuizAnswersApi(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/quizzes/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      return await res.json();
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Backend service error (${res.status}). Backend is not working.`);
  } catch (err) {
    if (err.message && err.message.includes("Backend")) {
      throw err;
    }
    throw new Error("Backend service is not working. Unable to evaluate quiz answers.");
  }
}

// Save Quiz Result & Get Leaderboard Standing
export async function saveQuizResultApi(resultData) {
  try {
    const res = await fetch(`${API_BASE_URL}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultData),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      return await res.json();
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Backend service error (${res.status}). Backend is not working.`);
  } catch (err) {
    if (err.message && err.message.includes("Backend")) {
      throw err;
    }
    throw new Error("Backend service is not working. Unable to save quiz result to database.");
  }
}

// Fetch Global Leaderboard
export async function getLeaderboardApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/leaderboard`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.leaderboard) {
        return data.leaderboard;
      }
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Backend service error (${res.status}). Backend is not working.`);
  } catch (err) {
    if (err.message && err.message.includes("Backend")) {
      throw err;
    }
    throw new Error("Backend service is not working. Unable to fetch leaderboard ranking.");
  }
}

// Get User Profile Metadata (User Service: GET /api/v1/users/:username)
export async function getUserProfileApi(username) {
  if (!username) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Backend service error (${res.status}). Backend is not working.`);
  } catch (err) {
    if (err.message && err.message.includes("Backend")) {
      throw err;
    }
    throw new Error("Backend service is not working. Unable to fetch user profile.");
  }
}

// Get User Quiz Attempt History (Result Service: GET /api/v1/results/user/:username)
export async function getUserHistoryApi(username) {
  if (!username) return { username, totalAttempts: 0, history: [] };
  try {
    const res = await fetch(`${API_BASE_URL}/results/user/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      return await res.json();
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Backend service error (${res.status}). Backend is not working.`);
  } catch (err) {
    if (err.message && err.message.includes("Backend")) {
      throw err;
    }
    throw new Error("Backend service is not working. Unable to fetch user quiz history.");
  }
}


