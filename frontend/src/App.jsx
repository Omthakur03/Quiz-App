import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { UsernameModal } from "./components/UsernameModal";
import { QuizCard } from "./components/QuizCard";
import { ResultsView } from "./components/ResultsView";
import { LeaderboardModal } from "./components/LeaderboardModal";
import { UserHistoryModal } from "./components/UserHistoryModal";
import { registerUserApi, getRandomQuizApi, submitQuizAnswersApi, saveQuizResultApi } from "./services/api";
import { Play, Sparkles, ShieldCheck, Cpu, Award, Trophy, Loader2 } from "lucide-react";

export default function App() {
  const [screen, setScreen] = useState("landing"); // 'landing' | 'quiz' | 'results'
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryUser, setSelectedHistoryUser] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizResults, setQuizResults] = useState(null);

  const handleStartQuizClick = async () => {
    if (currentUser) {
      await handleRetakeQuiz();
    } else {
      setIsUsernameModalOpen(true);
    }
  };

  const handleOpenUserHistory = (username, avatar) => {
    setSelectedHistoryUser({ username, avatar: avatar || currentUser?.avatar || "⚡" });
    setIsHistoryModalOpen(true);
  };

  const handleUsernameSubmitted = async (userInfo) => {
    setIsLoading(true);
    try {
      const user = await registerUserApi(userInfo);
      setCurrentUser(user);
      setIsUsernameModalOpen(false);

      const quizQuestions = await getRandomQuizApi(5);
      setQuestions(quizQuestions || []);
      setScreen("quiz");
    } catch (err) {
      console.error("Error starting quiz session:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishQuiz = async (quizSummary) => {
    setIsLoading(true);
    try {
      // Evaluate submission (server-side or local fallback)
      const evaluation = await submitQuizAnswersApi({
        questions,
        selectedAnswers: quizSummary.answers ? quizSummary.answers.reduce((acc, item, idx) => {
          acc[idx] = item.selectedOption;
          return acc;
        }, {}) : {},
        answers: quizSummary.answers,
        timeTaken: quizSummary.timeTaken
      });

      // Save quiz result
      const saved = await saveQuizResultApi({
        user_id: currentUser?.user_id,
        username: currentUser?.username || "Anonymous Engineer",
        avatar: currentUser?.avatar || "⚡",
        score: evaluation.score,
        total: evaluation.total,
        timeTaken: evaluation.timeTaken,
        answers: evaluation.answers
      });

      setQuizResults({
        ...evaluation,
        rank: saved.rank,
        entry: saved.entry,
        leaderboard: saved.leaderboard
      });

      setScreen("results");
    } catch (err) {
      console.error("Error finalizing quiz:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetakeQuiz = async () => {
    if (currentUser) {
      setIsLoading(true);
      try {
        const quizQuestions = await getRandomQuizApi(5);
        setQuestions(quizQuestions);
        setScreen("quiz");
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsUsernameModalOpen(true);
    }
  };

  return (
    <div>
      <Navbar
        user={currentUser}
        onOpenLeaderboard={() => setIsLeaderboardModalOpen(true)}
        onOpenUserHistory={(uname) => handleOpenUserHistory(uname, currentUser?.avatar)}
      />

      <main className="app-container">
        {screen === "landing" && (
          <section className="hero-section">
            <div className="hero-pill">
              <Sparkles size={14} /> Interactive DevOps & Cloud Quiz
            </div>

            <h1 className="hero-title">
              DevOps <span className="hero-title-italic">Engineering</span> <span className="hero-title-highlight">Capabilities</span>
            </h1>

            <p className="hero-description">
              Purpose-built for DevOps and Cloud Engineers where reliability, speed, and governance are non-negotiable. Complete your 5-question evaluation to claim your rank.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              <button className="btn-glow-primary" onClick={handleStartQuizClick}>
                <Play size={18} fill="#ffffff" />
                <span>Start Quiz</span>
              </button>

              <button className="btn-secondary-pill" style={{ padding: "0.85rem 1.8rem", borderRadius: "var(--radius-full)", fontSize: "0.95rem", fontWeight: 700 }} onClick={() => setIsLeaderboardModalOpen(true)}>
                <Trophy size={18} color="var(--accent-gold)" />
                <span>View Leaderboard</span>
              </button>
            </div>

            {/* Features Grid */}
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Cpu size={20} />
                </div>
                <h3 className="feature-title">Autonomous Evaluation</h3>
                <p className="feature-desc">
                  5 rapid-fire questions testing core proficiency in Docker, Kubernetes, CI/CD, and Terraform.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Award size={20} />
                </div>
                <h3 className="feature-title">Leaderboard Standing</h3>
                <p className="feature-desc">
                  Real-time rank calculation comparing score accuracy and speed against top cloud engineers.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="feature-title">Full Auditability</h3>
                <p className="feature-desc">
                  Detailed question breakdown with full technical explanations for continuous learning.
                </p>
              </div>
            </div>
          </section>
        )}

        {screen === "quiz" && (
          <QuizCard
            questions={questions}
            user={currentUser}
            onFinishQuiz={handleFinishQuiz}
          />
        )}

        {screen === "results" && quizResults && (
          <ResultsView
            resultData={quizResults}
            user={currentUser}
            onRetakeQuiz={handleRetakeQuiz}
            onOpenHistory={(uname, av) => handleOpenUserHistory(uname, av)}
          />
        )}
      </main>

      {/* Modals */}
      <UsernameModal
        isOpen={isUsernameModalOpen}
        onClose={() => setIsUsernameModalOpen(false)}
        onSubmitUsername={handleUsernameSubmitted}
      />

      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        onSelectEngineer={(uname, av) => handleOpenUserHistory(uname, av)}
      />

      <UserHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        username={selectedHistoryUser?.username}
        defaultAvatar={selectedHistoryUser?.avatar}
      />
    </div>
  );
}


