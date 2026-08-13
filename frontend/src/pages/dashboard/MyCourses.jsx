import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as coursesApi from "../../api/courses";
import Card from "../../components/ui/Card";

const STATUS_STYLES = {
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  dropped: "bg-slate-100 text-slate-500",
};

export default function MyCourses() {
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn: coursesApi.myEnrollments,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses", null],
    queryFn: () => coursesApi.listCourses(),
  });
  const courseById = new Map(courses.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">My Enrollments</h1>

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : enrollments.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500">
            You haven't enrolled in any courses yet. Head to{" "}
            <Link to="/dashboard/courses" className="font-medium text-brand hover:underline">
              Browse Courses
            </Link>{" "}
            to get started.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => {
            const course = courseById.get(e.course_id);
            return (
              <Card key={e.id}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{course?.title || `Course #${e.course_id}`}</h3>
                  <span className={`badge shrink-0 ${STATUS_STYLES[e.status] || "bg-slate-100 text-slate-500"}`}>
                    {e.status}
                  </span>
                </div>

                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span>{e.progress_percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{ width: `${e.progress_percent}%` }}
                  />
                </div>

                <Link to={`/dashboard/courses/${e.course_id}`} className="btn-secondary mt-4 block text-center">
                  {e.progress_percent >= 100 ? "Review course" : "Continue learning"}
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
