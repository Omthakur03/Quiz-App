import React, { useState, useEffect } from "react";
import { Clock, ArrowRight, CheckCircle2, Terminal, Loader2 } from "lucide-react";

const QUESTION_TIMEOUT_SECONDS = 25;

export function QuizCard({ questions = [], user, onFinishQuiz }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMEOUT_SECONDS);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);

  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeUser = user || { username: "Engineer", avatar: "⚡" };
  const totalQuestions = safeQuestions.length;
  const currentQuestion = totalQuestions > 0 ? safeQuestions[currentIndex] : null;
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  useEffect(() => {
    if (!currentQuestion) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return QUESTION_TIMEOUT_SECONDS;
        }
        return prev - 1;
      });
      setTotalSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, currentQuestion]);

  if (!currentQuestion) {
    return (
      <div className="quiz-container-fit" style={{ padding: "4rem 2rem", textAlign: "center", justifyContent: "center", alignItems: "center", display: "flex", flexDirection: "column" }}>
        <Loader2 size={36} className="spin-loader" style={{ marginBottom: "1rem", color: "var(--accent-gold)" }} />
        <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Preparing Assessment Questions...</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Fetching DevOps engineering questions from service pool.</p>
      </div>
    );
  }

  const handleSelectOption = (optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(QUESTION_TIMEOUT_SECONDS);
    } else {
      calculateAndFinish();
    }
  };

  const calculateAndFinish = () => {
    let score = 0;
    const answerBreakdown = questions.map((q, idx) => {
      const selected = selectedAnswers[idx];
      const isCorrect = selected === q.correct;
      if (isCorrect) score += 1;
      return {
        question: q.question,
        category: q.category,
        options: q.options,
        selectedOption: selected !== undefined ? selected : null,
        correctOption: q.correct,
        isCorrect,
        explanation: q.explanation
      };
    });

    onFinishQuiz({
      score,
      total: totalQuestions,
      timeTaken: totalSecondsElapsed,
      answers: answerBreakdown
    });
  };

  const optionLetters = ["A", "B", "C", "D"];
  const currentSelected = selectedAnswers[currentIndex];

  return (
    <div className="quiz-container-fit">
      {/* Dark Left Sidebar - Fluid AI Style */}
      <div className="quiz-side-panel">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "1.3rem" }}>{safeUser.avatar || "⚡"}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{safeUser.username}</div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)" }}>Active Engineer</div>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", uppercase: true, color: "rgba(255, 255, 255, 0.5)", fontWeight: 700, marginBottom: "0.3rem" }}>
              CATEGORY
            </div>
            <div className="category-badge">
              {currentQuestion.category}
            </div>
          </div>
        </div>

        <div>
          <div className={`timer-pill ${timeLeft <= 5 ? "warning" : ""}`} style={{ marginBottom: "1rem" }}>
            <Clock size={16} />
            <span>{timeLeft}s remaining</span>
          </div>

          <div style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.6)" }}>
            Question {currentIndex + 1} / {totalQuestions}
          </div>
        </div>
      </div>

      {/* Main Right Panel */}
      <div className="quiz-main-panel">
        <div>
          {/* Progress Bar */}
          <div style={{ margin: "0 0 1.25rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <span className="question-counter">Assessment Progress</span>
              <span className="question-counter" style={{ color: "var(--accent-gold-dark)" }}>
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          {/* Question Text */}
          <h2 className="question-text">{currentQuestion.question}</h2>

          {/* Options List */}
          <div className="options-list">
            {currentQuestion.options.map((optionText, optIdx) => {
              const isSelected = currentSelected === optIdx;
              return (
                <div
                  key={optIdx}
                  className={`option-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectOption(optIdx)}
                >
                  <div className="option-index">{optionLetters[optIdx]}</div>
                  <span className="option-text">{optionText}</span>
                  {isSelected && <CheckCircle2 size={18} color="var(--accent-gold-dark)" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="quiz-footer">
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            {currentSelected === undefined ? "Select an option to proceed" : "Answer recorded"}
          </div>

          <button
            className="btn-glow-primary"
            style={{ padding: "0.65rem 1.6rem", fontSize: "0.9rem" }}
            onClick={handleNextQuestion}
            disabled={currentSelected === undefined}
          >
            <span>{currentIndex + 1 === totalQuestions ? "Submit Quiz" : "Next Question"}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
