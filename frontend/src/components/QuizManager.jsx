import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as quizzesApi from "../api/quizzes";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import Input from "./ui/Input";
import { extractErrorMessage } from "../utils/errors";

const QUESTION_TYPES = [
  { value: "mcq", label: "Multiple choice" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short answer" },
];

function AddQuestionForm({ quizId, onDone, onError }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState("mcq");
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [correctTextAnswer, setCorrectTextAnswer] = useState("");

  const addQuestionMutation = useMutation({
    mutationFn: (payload) => quizzesApi.addQuestion(quizId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-quizzes"] });
      onDone();
    },
    onError: (err) => onError(extractErrorMessage(err, "Could not add question.")),
  });

  const submit = (e) => {
    e.preventDefault();
    if (type === "mcq") {
      const cleanOptions = options.filter((o) => o.trim());
      addQuestionMutation.mutate({
        text,
        type,
        options: cleanOptions.map((t, i) => ({ text: t, is_correct: i === correctIndex })),
      });
    } else if (type === "true_false") {
      addQuestionMutation.mutate({
        text,
        type,
        options: [
          { text: "True", is_correct: correctIndex === 0 },
          { text: "False", is_correct: correctIndex === 1 },
        ],
      });
    } else {
      addQuestionMutation.mutate({ text, type, correct_text_answer: correctTextAnswer });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Question type</label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <Input label="Question text" value={text} onChange={(e) => setText(e.target.value)} required />

      {type === "mcq" && (
        <div>
          <label className="label">Options (mark the correct one)</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)}
                />
                <input
                  className="input-field"
                  value={opt}
                  placeholder={`Option ${i + 1}`}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {type === "true_false" && (
        <div>
          <label className="label">Correct answer</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="tf" checked={correctIndex === 0} onChange={() => setCorrectIndex(0)} />
              True
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="tf" checked={correctIndex === 1} onChange={() => setCorrectIndex(1)} />
              False
            </label>
          </div>
        </div>
      )}

      {type === "short_answer" && (
        <Input
          label="Correct answer (exact match, case-insensitive)"
          value={correctTextAnswer}
          onChange={(e) => setCorrectTextAnswer(e.target.value)}
          required
        />
      )}

      <Button type="submit" className="w-full" disabled={addQuestionMutation.isPending}>
        {addQuestionMutation.isPending ? "Adding..." : "Add question"}
      </Button>
    </form>
  );
}

export default function QuizManager({ courseId, isStaff }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [questionModalFor, setQuestionModalFor] = useState(null);
  const [error, setError] = useState("");

  const { data: quizzes = [] } = useQuery({
    queryKey: ["course-quizzes", courseId],
    queryFn: () => quizzesApi.listQuizzesForCourse(courseId),
  });

  const createForm = useForm();
  const createQuizMutation = useMutation({
    mutationFn: (data) => quizzesApi.createQuiz({ course_id: courseId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-quizzes", courseId] });
      setCreateOpen(false);
      createForm.reset();
    },
    onError: (err) => setError(extractErrorMessage(err, "Could not create quiz.")),
  });

  const onCreateQuiz = (data) => {
    setError("");
    createQuizMutation.mutate({
      title: data.title,
      passing_score: Number(data.passing_score) || 70,
      time_limit_minutes: data.time_limit_minutes ? Number(data.time_limit_minutes) : null,
    });
  };

  if (!isStaff) return null;

  return (
    <Card
      title="Quizzes"
      actions={
        <Button variant="secondary" onClick={() => setCreateOpen(true)}>
          + New quiz
        </Button>
      }
    >
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {quizzes.length === 0 ? (
        <p className="text-sm text-slate-500">No quizzes yet.</p>
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <div>
                <p className="font-medium text-slate-800">📝 {quiz.title}</p>
                <p className="text-xs text-slate-500">
                  {quiz.questions.length} question(s) · pass at {quiz.passing_score}%
                  {quiz.time_limit_minutes ? ` · ${quiz.time_limit_minutes} min timer` : " · no timer"}
                </p>
              </div>
              <Button variant="secondary" onClick={() => setQuestionModalFor(quiz)}>
                + Question
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create a quiz">
        <form onSubmit={createForm.handleSubmit(onCreateQuiz)} className="space-y-4">
          <Input
            label="Title"
            error={createForm.formState.errors.title?.message}
            {...createForm.register("title", { required: "Required" })}
          />
          <Input label="Passing score (%)" type="number" defaultValue={70} {...createForm.register("passing_score")} />
          <Input
            label="Time limit in minutes (optional)"
            type="number"
            placeholder="Leave blank for no time limit"
            {...createForm.register("time_limit_minutes")}
          />
          <Button type="submit" className="w-full" disabled={createQuizMutation.isPending}>
            {createQuizMutation.isPending ? "Creating..." : "Create quiz"}
          </Button>
        </form>
      </Modal>

      <Modal
        open={!!questionModalFor}
        onClose={() => setQuestionModalFor(null)}
        title={`Add question — ${questionModalFor?.title ?? ""}`}
      >
        {questionModalFor && (
          <AddQuestionForm quizId={questionModalFor.id} onDone={() => setQuestionModalFor(null)} onError={setError} />
        )}
      </Modal>
    </Card>
  );
}
