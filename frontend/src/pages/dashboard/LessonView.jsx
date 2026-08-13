import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import * as coursesApi from "../../api/courses";
import * as progressApi from "../../api/progress";
import Button from "../../components/ui/Button";
import AssignmentManager from "../../components/AssignmentManager";
import { toEmbeddableUrl } from "../../utils/embed";

const STAFF_ROLES = ["head_admin", "moderator", "instructor"];

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function BigResource({ resource }) {
  const { title, resource_type, kind, external_url, file_path } = resource;
  const isLink = resource_type === "external_link";
  const embedUrl = isLink ? toEmbeddableUrl(external_url) : `${API_BASE}/uploads/${file_path}`;
  const isFramed = isLink ? embedUrl !== external_url : kind === "pdf";

  if (kind === "image") {
    return (
      <img
        src={embedUrl}
        alt={title}
        className="max-h-[70vh] w-full rounded-xl border border-slate-200 object-contain bg-slate-50"
      />
    );
  }

  if (kind === "video" && !isLink) {
    return (
      <video controls className="w-full rounded-xl border border-slate-200 bg-black">
        <source src={embedUrl} />
      </video>
    );
  }

  if (isFramed) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:aspect-[16/8]">
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-14 text-center">
      <span className="text-4xl">📎</span>
      <p className="text-sm text-slate-600">This resource can't be previewed inline.</p>
      <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
        Open “{title}” in a new tab ↗
      </a>
    </div>
  );
}

export default function LessonView() {
  const { id, lessonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStudent = user?.role === "student";
  const isStaff = STAFF_ROLES.includes(user?.role);
  const [activeResourceIdx, setActiveResourceIdx] = useState(0);

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

  const completeMutation = useMutation({
    mutationFn: () => progressApi.markLessonComplete(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-progress", id] });
    },
  });

  const flat = useMemo(() => {
    if (!course) return [];
    const list = [];
    course.modules.forEach((m) => m.lessons.forEach((l) => list.push({ ...l, moduleTitle: m.title })));
    return list;
  }, [course]);

  const currentIndex = flat.findIndex((l) => String(l.id) === String(lessonId));
  const lesson = flat[currentIndex];
  const prevLesson = currentIndex > 0 ? flat[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null;

  if (isLoading) return <p className="text-sm text-slate-500">Loading lesson...</p>;
  if (!course) return <p className="text-sm text-slate-500">Course not found.</p>;

  if (isStudent && !isEnrolled) {
    return (
      <div className="space-y-4">
        <Link to={`/dashboard/courses/${id}`} className="text-sm font-medium text-brand hover:underline">
          ← Back to course
        </Link>
        <div className="card text-center">
          <p className="text-3xl">🔒</p>
          <p className="mt-2 text-sm text-slate-600">Enroll in this course to view this lesson.</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-4">
        <Link to={`/dashboard/courses/${id}`} className="text-sm font-medium text-brand hover:underline">
          ← Back to course
        </Link>
        <p className="text-sm text-slate-500">Lesson not found.</p>
      </div>
    );
  }

  const isCompleted = progress?.completed_lesson_ids?.includes(lesson.id);
  const resources = lesson.resources;
  const activeResource = resources[activeResourceIdx] || resources[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={`/dashboard/courses/${id}`} className="text-sm font-medium text-brand hover:underline">
          ← Back to {course.title}
        </Link>
        <p className="text-xs uppercase tracking-wide text-slate-400">{lesson.moduleTitle}</p>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{lesson.title}</h1>
      </div>

      {/* Resource viewer */}
      <div className="card">
        {resources.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No video or file attached to this lesson yet.</p>
        ) : (
          <>
            {activeResource && <BigResource resource={activeResource} />}

            {resources.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {resources.map((r, idx) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveResourceIdx(idx)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                      idx === activeResourceIdx
                        ? "border-brand bg-brand-50 text-brand-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {lesson.content && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="mb-1.5 text-sm font-semibold text-slate-700">Description</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{lesson.content}</p>
          </div>
        )}
      </div>

      {/* Assignments for this lesson */}
      <div className="card">
        <h3 className="mb-1 text-sm font-semibold text-slate-700">Assignments</h3>
        <AssignmentManager lessonId={lesson.id} isStaff={isStaff} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {prevLesson ? (
            <button
              onClick={() => navigate(`/dashboard/courses/${id}/lesson/${prevLesson.id}`)}
              className="btn-secondary"
            >
              ← Previous
            </button>
          ) : (
            <span />
          )}
        </div>

        <div className="flex items-center gap-2">
          {isStudent && isEnrolled && (
            <Button
              variant={isCompleted ? "secondary" : "primary"}
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending || isCompleted}
            >
              {isCompleted ? "✓ Completed" : completeMutation.isPending ? "Saving..." : "Mark as complete"}
            </Button>
          )}
          {nextLesson && (
            <Button variant="secondary" onClick={() => navigate(`/dashboard/courses/${id}/lesson/${nextLesson.id}`)}>
              Next →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
