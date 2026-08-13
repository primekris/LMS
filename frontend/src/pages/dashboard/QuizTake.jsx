import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as quizzesApi from "../../api/quizzes";
import Button from "../../components/ui/Button";
import { extractErrorMessage } from "../../utils/errors";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function QuizTake() {
  const { id, quizId } = useParams();
  const navigate = useNavigate();

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["course-quizzes", Number(id)],
    queryFn: () => quizzesApi.listQuizzesForCourse(id),
  });
  const quiz = quizzes.find((q) => String(q.id) === String(quizId));

  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const timerRef = useRef(null);

  const submitMutation = useMutation({
    mutationFn: () =>
      quizzesApi.submitAttempt(
        quiz.id,
        quiz.questions.map((q) => ({
          question_id: q.id,
          selected_option_id: answers[q.id]?.optionId ?? null,
          text_answer: answers[q.id]?.text ?? null,
        }))
      ),
    onSuccess: (attempt) => {
      setResult(attempt);
      clearTimeout(timerRef.current);
    },
    onError: (err) => setError(extractErrorMessage(err, "Could not submit the quiz.")),
  });

  useEffect(() => {
    if (!started || result || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      submitMutation.mutate();
      return;
    }
    timerRef.current = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, secondsLeft, result]);

  if (isLoading) return <p className="text-sm text-slate-500">Loading quiz...</p>;

  if (!quiz) {
    return (
      <div className="space-y-4">
        <Link to={`/dashboard/courses/${id}`} className="text-sm font-medium text-brand hover:underline">
          ← Back to course
        </Link>
        <p className="text-sm text-slate-500">Quiz not found.</p>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;

  const startQuiz = () => {
    setStarted(true);
    const limitMinutes = quiz.time_limit_minutes || Math.max(5, Math.ceil(totalQuestions * 1.5));
    setSecondsLeft(limitMinutes * 60);
  };

  const setAnswer = (questionId, value) => setAnswers((a) => ({ ...a, [questionId]: value }));

  // --- Result screen ---
  if (result) {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <div className="card text-center">
          <p className="text-5xl">{result.passed ? "🎉" : "📘"}</p>
          <p className="mt-3 text-4xl font-bold text-brand">{result.score_percent}%</p>
          <p className={`mt-1 text-sm font-semibold ${result.passed ? "text-green-600" : "text-red-600"}`}>
            {result.passed ? "Passed" : "Not passed"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {result.correct_count ?? "—"} / {result.total_questions ?? totalQuestions} correct · pass mark{" "}
            {quiz.passing_score}%
          </p>
          <div className="mt-6 flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setResult(null);
                setStarted(false);
                setAnswers({});
                setCurrentQ(0);
                setError("");
              }}
            >
              Retake quiz
            </Button>
            <Button className="flex-1" onClick={() => navigate(`/dashboard/courses/${id}`)}>
              Back to course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Start screen ---
  if (!started) {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <Link to={`/dashboard/courses/${id}`} className="text-sm font-medium text-brand hover:underline">
          ← Back to course
        </Link>
        <div className="card text-center">
          <p className="text-3xl">📝</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">{quiz.title}</h1>
          <div className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-lg font-bold text-slate-800">{totalQuestions}</p>
              <p className="text-xs text-slate-500">Questions</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-lg font-bold text-slate-800">
                {quiz.time_limit_minutes ? `${quiz.time_limit_minutes}m` : "No limit"}
              </p>
              <p className="text-xs text-slate-500">Time</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Pass mark: {quiz.passing_score}% · Once started, the timer can't be paused.
          </p>
          {totalQuestions === 0 ? (
            <p className="mt-6 text-sm text-slate-400">This quiz has no questions yet.</p>
          ) : (
            <Button className="mt-6 w-full" onClick={startQuiz}>
              Start quiz
            </Button>
          )}
        </div>
      </div>
    );
  }

  // --- In-progress: one question at a time ---
  const question = quiz.questions[currentQ];
  const isLast = currentQ === totalQuestions - 1;
  const timeLow = secondsLeft !== null && secondsLeft <= 30;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          Question {currentQ + 1} of {totalQuestions}
        </p>
        {secondsLeft !== null && (
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${
              timeLow ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-700"
            }`}
          >
            ⏱ {formatTime(secondsLeft)}
          </span>
        )}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${((currentQ + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question palette */}
      <div className="flex flex-wrap gap-1.5">
        {quiz.questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentQ(idx)}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${
              idx === currentQ
                ? "bg-brand text-white"
                : answers[q.id]
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      <div className="card">
        <p className="mb-4 text-base font-medium text-slate-800">{question.text}</p>

        {question.type === "short_answer" ? (
          <input
            className="input-field"
            value={answers[question.id]?.text ?? ""}
            onChange={(e) => setAnswer(question.id, { text: e.target.value })}
            placeholder="Type your answer"
          />
        ) : (
          <div className="space-y-2">
            {question.options.map((opt) => {
              const selected = answers[question.id]?.optionId === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm transition ${
                    selected ? "border-brand bg-brand-50 text-brand-700" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${question.id}`}
                    checked={selected}
                    onChange={() => setAnswer(question.id, { optionId: opt.id })}
                    className="accent-brand"
                  />
                  {opt.text}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <Button variant="secondary" onClick={() => setCurrentQ((q) => Math.max(0, q - 1))} disabled={currentQ === 0}>
          ← Previous
        </Button>

        <p className="text-xs text-slate-400">{answeredCount}/{totalQuestions} answered</p>

        {isLast ? (
          <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
            {submitMutation.isPending ? "Submitting..." : "Submit quiz"}
          </Button>
        ) : (
          <Button onClick={() => setCurrentQ((q) => Math.min(totalQuestions - 1, q + 1))}>Next →</Button>
        )}
      </div>
    </div>
  );
}
