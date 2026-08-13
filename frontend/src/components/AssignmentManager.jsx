import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import * as assignmentsApi from "../api/assignments";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import Input from "./ui/Input";
import { extractErrorMessage } from "../utils/errors";

function SubmissionsPanel({ assignment, onClose }) {
  const queryClient = useQueryClient();
  const [gradingId, setGradingId] = useState(null);
  const [error, setError] = useState("");

  const { data: submissions = [] } = useQuery({
    queryKey: ["submissions", assignment.id],
    queryFn: () => assignmentsApi.listSubmissions(assignment.id),
  });

  const gradeForm = useForm();
  const gradeMutation = useMutation({
    mutationFn: ({ submissionId, grade, feedback }) =>
      assignmentsApi.gradeSubmission(submissionId, grade, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions", assignment.id] });
      setGradingId(null);
      gradeForm.reset();
    },
    onError: (err) => setError(extractErrorMessage(err, "Could not save grade.")),
  });

  return (
    <Modal open onClose={onClose} title={`Submissions — ${assignment.title}`}>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {submissions.length === 0 ? (
        <p className="text-sm text-slate-500">No submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div key={s.id} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL || ""}/uploads/${s.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand hover:underline"
                >
                  View submission ↗
                </a>
                {s.grade != null ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Graded: {s.grade}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Pending review
                  </span>
                )}
              </div>
              {s.feedback && <p className="mb-2 text-sm text-slate-600">Feedback: {s.feedback}</p>}

              {gradingId === s.id ? (
                <form
                  onSubmit={gradeForm.handleSubmit((data) => {
                    setError("");
                    gradeMutation.mutate({ submissionId: s.id, grade: Number(data.grade), feedback: data.feedback });
                  })}
                  className="mt-2 space-y-2"
                >
                  <Input label="Grade" type="number" step="0.1" {...gradeForm.register("grade", { required: true })} />
                  <Input label="Feedback" {...gradeForm.register("feedback")} />
                  <Button type="submit" className="w-full" disabled={gradeMutation.isPending}>
                    Save grade
                  </Button>
                </form>
              ) : (
                <Button variant="secondary" onClick={() => setGradingId(s.id)}>
                  {s.grade != null ? "Update grade" : "Grade this"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function AssignmentManager({ lessonId, isStaff }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [submissionsFor, setSubmissionsFor] = useState(null);
  const [error, setError] = useState("");

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", lessonId],
    queryFn: () => assignmentsApi.listForLesson(lessonId),
  });

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: assignmentsApi.mySubmissions,
    enabled: user?.role === "student",
  });

  const createForm = useForm();
  const createMutation = useMutation({
    mutationFn: (data) => assignmentsApi.createAssignment({ lesson_id: lessonId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", lessonId] });
      setCreateOpen(false);
      createForm.reset();
    },
    onError: (err) => setError(extractErrorMessage(err, "Could not create assignment.")),
  });

  const submitMutation = useMutation({
    mutationFn: ({ assignmentId, file }) => assignmentsApi.submitAssignment(assignmentId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-submissions"] }),
    onError: (err) => setError(extractErrorMessage(err, "Could not submit assignment.")),
  });

  if (assignments.length === 0 && !isStaff) return null;

  return (
    <div className="mt-3 space-y-2">
      {assignments.map((a) => {
        const mySubmission = mySubmissions.find((s) => s.assignment_id === a.id);
        return (
          <div key={a.id} className="flex items-center justify-between rounded-lg bg-white p-2.5 text-sm">
            <div>
              <p className="font-medium text-slate-800">📝 {a.title}</p>
              {a.instructions && <p className="text-xs text-slate-500">{a.instructions}</p>}
            </div>

            {isStaff ? (
              <Button variant="secondary" onClick={() => setSubmissionsFor(a)}>
                Submissions
              </Button>
            ) : user?.role === "student" ? (
              mySubmission ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    mySubmission.grade != null ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {mySubmission.grade != null ? `Graded: ${mySubmission.grade}` : "Submitted — pending review"}
                </span>
              ) : (
                <label className="btn-secondary cursor-pointer">
                  Submit
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) submitMutation.mutate({ assignmentId: a.id, file });
                    }}
                  />
                </label>
              )
            ) : null}
          </div>
        );
      })}

      {isStaff && (
        <Button variant="secondary" onClick={() => setCreateOpen(true)}>
          + Assignment
        </Button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create an assignment">
        <form
          onSubmit={createForm.handleSubmit((data) => {
            setError("");
            createMutation.mutate({ title: data.title, instructions: data.instructions });
          })}
          className="space-y-4"
        >
          <Input
            label="Title"
            error={createForm.formState.errors.title?.message}
            {...createForm.register("title", { required: "Required" })}
          />
          <div>
            <label className="label">Instructions</label>
            <textarea rows={3} className="input-field" {...createForm.register("instructions")} />
          </div>
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create assignment"}
          </Button>
        </form>
      </Modal>

      {submissionsFor && <SubmissionsPanel assignment={submissionsFor} onClose={() => setSubmissionsFor(null)} />}
    </div>
  );
}
