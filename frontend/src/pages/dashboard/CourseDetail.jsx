import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as coursesApi from "../../api/courses";
import * as resourcesApi from "../../api/resources";
import * as certificatesApi from "../../api/certificates";
import * as progressApi from "../../api/progress";
import * as quizzesApi from "../../api/quizzes";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import QuizManager from "../../components/QuizManager";
import { extractErrorMessage } from "../../utils/errors";

const STAFF_ROLES = ["head_admin", "moderator", "instructor"];

function resourceIcon(resource) {
  if (!resource) return "📄";
  if (resource.kind === "video") return "🎬";
  if (resource.kind === "image") return "🖼️";
  if (resource.kind === "pdf" || resource.resource_type === "file") return "📄";
  return "🔗";
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = STAFF_ROLES.includes(user?.role);
  const isStudent = user?.role === "student";

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [lessonModalFor, setLessonModalFor] = useState(null);
  const [resourceModalFor, setResourceModalFor] = useState(null);
  const [resourceMode, setResourceMode] = useState("file");
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [enrollConfirmOpen, setEnrollConfirmOpen] = useState(false);
  const [openModuleId, setOpenModuleId] = useState(null);
  const [error, setError] = useState("");

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: () => coursesApi.getCourse(id),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments"],
    queryFn: coursesApi.myEnrollments,
    enabled: isStudent,
  });
  const isEnrolled = isStudent && enrollments.some((e) => e.course_id === Number(id));

  const { data: progress } = useQuery({
    queryKey: ["course-progress", id],
    queryFn: () => progressApi.getCourseProgress(id),
    enabled: isStudent && isEnrolled,
  });
  const completedLessonIds = new Set(progress?.completed_lesson_ids ?? []);

  const { data: quizzes = [] } = useQuery({
    queryKey: ["course-quizzes", Number(id)],
    queryFn: () => quizzesApi.listQuizzesForCourse(id),
    enabled: !!course,
  });

  const { data: enrolledStudents = [] } = useQuery({
    queryKey: ["course-enrollments", id],
    queryFn: () => coursesApi.listCourseEnrollments(id),
    enabled: isStaff && certModalOpen,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["course", id] });

  const moduleForm = useForm();
  const lessonForm = useForm();
  const resourceForm = useForm();

  const enrollMutation = useMutation({
    mutationFn: () => coursesApi.enrollInCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      setEnrollConfirmOpen(false);
    },
    onError: (err) => setError(extractErrorMessage(err, "Could not enroll.")),
  });

  const addModuleMutation = useMutation({
    mutationFn: (data) => coursesApi.addModule(id, data),
    onSuccess: () => {
      invalidate();
      setModuleModalOpen(false);
      moduleForm.reset();
    },
    onError: (err) => setError(extractErrorMessage(err, "Could not add module.")),
  });

  const addLessonMutation = useMutation({
    mutationFn: ({ moduleId, data }) => coursesApi.addLesson(moduleId, data),
    onSuccess: () => {
      invalidate();
      setLessonModalFor(null);
      lessonForm.reset();
    },
    onError: (err) => setError(extractErrorMessage(err, "Could not add lesson.")),
  });

  const addFileResourceMutation = useMutation({
    mutationFn: ({ lessonId, title, file }) => resourcesApi.uploadFileResource(lessonId, title, file),
    onSuccess: () => {
      invalidate();
      setResourceModalFor(null);
      resourceForm.reset();
    },
    onError: (err) => setError(extractErrorMessage(err, "Could not upload the file.")),
  });

  const addLinkResourceMutation = useMutation({
    mutationFn: ({ lessonId, title, url }) => resourcesApi.addLinkResource(lessonId, title, url),
    onSuccess: () => {
      invalidate();
      setResourceModalFor(null);
      resourceForm.reset();
    },
    onError: (err) => setError(extractErrorMessage(err, "Could not add the link.")),
  });

  const issueCertMutation = useMutation({
    mutationFn: (studentId) => certificatesApi.issueCertificate(studentId, Number(id)),
    onSuccess: () => setCertModalOpen(false),
    onError: (err) => setError(extractErrorMessage(err, "Could not issue certificate.")),
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading course...</p>;
  if (!course) return <p className="text-sm text-slate-500">Course not found.</p>;

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalResources = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + l.resources.length, 0),
    0
  );

  const onAddModule = (data) => {
    setError("");
    addModuleMutation.mutate({ title: data.title, order: course.modules.length });
  };

  const onAddLesson = (data) => {
    setError("");
    addLessonMutation.mutate({
      moduleId: lessonModalFor,
      data: { title: data.title, content: data.content, order: 0 },
    });
  };

  const onAddResource = (data) => {
    setError("");
    if (resourceMode === "file") {
      const file = data.file?.[0];
      if (!file) {
        setError("Please choose a file.");
        return;
      }
      addFileResourceMutation.mutate({ lessonId: resourceModalFor, title: data.title, file });
    } else {
      addLinkResourceMutation.mutate({ lessonId: resourceModalFor, title: data.title, url: data.url });
    }
  };

  const showLockedPreview = isStudent && !isEnrolled;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl bg-brand-dark text-white">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-8">
          <div className="max-w-2xl">
            {course.category_id && (
              <span className="badge mb-3 bg-white/15 text-white">Course</span>
            )}
            <h1 className="text-2xl font-bold sm:text-3xl">{course.title}</h1>
            <p className="mt-2 text-sm text-slate-200 sm:text-base">
              {course.description || "No description yet."}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
              <span>📚 {course.modules.length} module{course.modules.length === 1 ? "" : "s"}</span>
              <span>🎬 {totalLessons} lesson{totalLessons === 1 ? "" : "s"}</span>
              <span>📎 {totalResources} resource{totalResources === 1 ? "" : "s"}</span>
              {quizzes.length > 0 && <span>📝 {quizzes.length} quiz{quizzes.length === 1 ? "" : "zes"}</span>}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2">
            {isStaff && (
              <Button variant="secondary" className="!bg-white/10 !text-white !border-white/30 hover:!bg-white/20" onClick={() => setCertModalOpen(true)}>
                🎓 Issue certificate
              </Button>
            )}
            {showLockedPreview && (
              <Button onClick={() => setEnrollConfirmOpen(true)} disabled={enrollMutation.isPending}>
                {enrollMutation.isPending ? "Enrolling..." : "Enroll in this course"}
              </Button>
            )}
            {isStudent && isEnrolled && progress?.progress_percent === 100 && (
              <span className="badge justify-center bg-green-500/20 text-green-200">✓ Completed</span>
            )}
          </div>
        </div>

        {/* Progress box */}
        {isStudent && isEnrolled && (
          <div className="border-t border-white/10 bg-black/10 px-5 py-4 sm:px-8">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-100">Your progress</span>
              <span className="text-slate-300">
                {progress?.completed_lessons ?? 0} / {progress?.total_lessons ?? totalLessons} lessons ·{" "}
                {progress?.progress_percent ?? 0}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${progress?.progress_percent ?? 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      {showLockedPreview && (
        <Card>
          <p className="text-sm text-slate-600">
            🔒 Enroll in this course to unlock all lessons, downloadable resources, and quizzes. Below is a
            preview of what's included.
          </p>
        </Card>
      )}

      {/* Curriculum */}
      <Card title="Curriculum">
        {course.modules.length === 0 ? (
          <p className="text-sm text-slate-500">No modules yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {course.modules.map((module, mIdx) => {
              const isOpen = openModuleId === module.id || (openModuleId === null && mIdx === 0);
              return (
                <div key={module.id} className="py-2">
                  <button
                    type="button"
                    onClick={() => setOpenModuleId(isOpen ? -1 : module.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-900">
                      {mIdx + 1}. {module.title}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-slate-400">
                      {module.lessons.length} lesson{module.lessons.length === 1 ? "" : "s"}
                      <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="space-y-1.5 px-1 pb-2 pt-1">
                      {module.lessons.length === 0 && (
                        <p className="px-2 py-2 text-sm text-slate-400">No lessons in this module yet.</p>
                      )}
                      {module.lessons.map((lesson) => {
                        const locked = showLockedPreview;
                        const completed = completedLessonIds.has(lesson.id);
                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2.5"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="text-lg leading-none">
                                {completed ? "✅" : locked ? "🔒" : resourceIcon(lesson.resources[0])}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">{lesson.title}</p>
                                <p className="text-xs text-slate-400">
                                  {lesson.resources.length} resource{lesson.resources.length === 1 ? "" : "s"}
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5">
                              {isStaff && (
                                <Button
                                  variant="secondary"
                                  className="!px-3 !py-1.5 !text-xs"
                                  onClick={() => setResourceModalFor(lesson.id)}
                                >
                                  + Resource
                                </Button>
                              )}
                              {locked ? (
                                <span className="px-3 py-1.5 text-xs font-medium text-slate-400">Locked</span>
                              ) : (
                                <Link
                                  to={`/dashboard/courses/${id}/lesson/${lesson.id}`}
                                  className="btn-secondary !px-3 !py-1.5 !text-xs"
                                >
                                  View
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {isStaff && (
                        <button
                          type="button"
                          onClick={() => setLessonModalFor(module.id)}
                          className="ml-1 mt-1 text-xs font-semibold text-brand hover:underline"
                        >
                          + Add lesson
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isStaff && (
          <Button variant="secondary" className="mt-4" onClick={() => setModuleModalOpen(true)}>
            + Add module
          </Button>
        )}
      </Card>

      {/* Quizzes */}
      {isStaff ? (
        <QuizManager courseId={course.id} isStaff={isStaff} />
      ) : (
        quizzes.length > 0 && (
          <Card title="Quizzes">
            {showLockedPreview ? (
              <p className="text-sm text-slate-500">🔒 Enroll to take the quizzes for this course.</p>
            ) : (
              <div className="space-y-2">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="font-medium text-slate-800">📝 {quiz.title}</p>
                      <p className="text-xs text-slate-500">
                        {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"} · pass at{" "}
                        {quiz.passing_score}%
                        {quiz.time_limit_minutes ? ` · ${quiz.time_limit_minutes} min` : ""}
                      </p>
                    </div>
                    {quiz.questions.length > 0 && (
                      <Button onClick={() => navigate(`/dashboard/courses/${id}/quiz/${quiz.id}`)}>
                        Start quiz
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      )}

      {/* Add module */}
      <Modal open={moduleModalOpen} onClose={() => setModuleModalOpen(false)} title="Add a module">
        <form onSubmit={moduleForm.handleSubmit(onAddModule)} className="space-y-4">
          <Input
            label="Module title"
            error={moduleForm.formState.errors.title?.message}
            {...moduleForm.register("title", { required: "Required" })}
          />
          <Button type="submit" className="w-full" disabled={addModuleMutation.isPending}>
            {addModuleMutation.isPending ? "Adding..." : "Add module"}
          </Button>
        </form>
      </Modal>

      {/* Add lesson */}
      <Modal open={!!lessonModalFor} onClose={() => setLessonModalFor(null)} title="Add a lesson">
        <form onSubmit={lessonForm.handleSubmit(onAddLesson)} className="space-y-4">
          <Input
            label="Lesson title"
            error={lessonForm.formState.errors.title?.message}
            {...lessonForm.register("title", { required: "Required" })}
          />
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input-field" {...lessonForm.register("content")} />
          </div>
          <Button type="submit" className="w-full" disabled={addLessonMutation.isPending}>
            {addLessonMutation.isPending ? "Adding..." : "Add lesson"}
          </Button>
        </form>
      </Modal>

      {/* Add resource */}
      <Modal open={!!resourceModalFor} onClose={() => setResourceModalFor(null)} title="Add a resource">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setResourceMode("file")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              resourceMode === "file" ? "border-brand bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600"
            }`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => setResourceMode("link")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
              resourceMode === "link" ? "border-brand bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600"
            }`}
          >
            YouTube / external link
          </button>
        </div>

        <form onSubmit={resourceForm.handleSubmit(onAddResource)} className="space-y-4">
          <Input
            label="Title"
            error={resourceForm.formState.errors.title?.message}
            {...resourceForm.register("title", { required: "Required" })}
          />

          {resourceMode === "file" ? (
            <div>
              <label className="label">
                File <span className="text-slate-400">(video, image, PDF, DOCX, PPT, or ZIP)</span>
              </label>
              <input
                type="file"
                accept=".mp4,.mov,.webm,.png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.ppt,.pptx,.zip"
                className="input-field"
                {...resourceForm.register("file", { required: resourceMode === "file" })}
              />
            </div>
          ) : (
            <Input
              label="URL"
              placeholder="https://youtube.com/watch?v=..."
              error={resourceForm.formState.errors.url?.message}
              {...resourceForm.register("url", { required: resourceMode === "link" })}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={addFileResourceMutation.isPending || addLinkResourceMutation.isPending}
          >
            {addFileResourceMutation.isPending || addLinkResourceMutation.isPending ? "Adding..." : "Add resource"}
          </Button>
        </form>
      </Modal>

      {/* Issue certificate */}
      <Modal open={certModalOpen} onClose={() => setCertModalOpen(false)} title="Issue a certificate">
        {enrolledStudents.length === 0 ? (
          <p className="text-sm text-slate-500">No students enrolled in this course yet.</p>
        ) : (
          <div className="space-y-2">
            {enrolledStudents.map((s) => (
              <div key={s.student_id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.full_name}</p>
                  <p className="text-xs text-slate-500">{s.email}</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => issueCertMutation.mutate(s.student_id)}
                  disabled={issueCertMutation.isPending}
                >
                  Issue
                </Button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Enroll confirmation */}
      <Modal open={enrollConfirmOpen} onClose={() => setEnrollConfirmOpen(false)} title="Enroll in this course?">
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-slate-900">{course.title}</p>
            <p className="mt-1 text-sm text-slate-500">{course.description || "No description provided."}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="badge bg-slate-100">📚 {course.modules.length} modules</span>
            <span className="badge bg-slate-100">🎬 {totalLessons} lessons</span>
            {quizzes.length > 0 && <span className="badge bg-slate-100">📝 {quizzes.length} quizzes</span>}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
            {enrollMutation.isPending ? "Enrolling..." : "Confirm enrollment"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
