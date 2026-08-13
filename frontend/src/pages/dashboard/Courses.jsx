import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as coursesApi from "../../api/courses";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import { extractErrorMessage } from "../../utils/errors";

const STAFF_ROLES = ["head_admin", "moderator", "instructor"];

export default function Courses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [serverError, setServerError] = useState("");
  const canCreate = STAFF_ROLES.includes(user?.role);
  const isStaff = STAFF_ROLES.includes(user?.role);
  const isStudent = user?.role === "student";

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses", activeCategory],
    queryFn: () => coursesApi.listCourses(activeCategory),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: coursesApi.listCategories,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments"],
    queryFn: coursesApi.myEnrollments,
    enabled: isStudent,
  });
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));

  const createMutation = useMutation({ mutationFn: coursesApi.createCourse });
  const createCategoryMutation = useMutation({ mutationFn: coursesApi.createCategory });

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }) =>
      publish ? coursesApi.publishCourse(id) : coursesApi.unpublishCourse(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
    onError: (err) => setServerError(extractErrorMessage(err, "Could not update course status.")),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const categoryForm = useForm();

  const onCreate = async (data) => {
    setServerError("");
    try {
      await createMutation.mutateAsync({
        title: data.title,
        description: data.description,
        category_id: data.category_id ? Number(data.category_id) : null,
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      reset();
      setModalOpen(false);
    } catch (err) {
      setServerError(extractErrorMessage(err, "Could not create the course."));
    }
  };

  const onCreateCategory = async (data) => {
    setServerError("");
    try {
      await createCategoryMutation.mutateAsync(data.name);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      categoryForm.reset();
      setCategoryModalOpen(false);
    } catch (err) {
      setServerError(extractErrorMessage(err, "Could not create category."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Courses</h1>
        <div className="flex gap-2">
          {isStaff && (
            <Button variant="secondary" onClick={() => setCategoryModalOpen(true)}>
              + Category
            </Button>
          )}
          {canCreate && (
            <Button
              onClick={() => {
                setServerError("");
                setModalOpen(true);
              }}
            >
              + New course
            </Button>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              !activeCategory ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                activeCategory === c.id ? "bg-brand text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {serverError && !modalOpen && !categoryModalOpen && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{serverError}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading courses...</p>
      ) : courses.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-slate-500">No courses yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <Card key={course.id} className="flex flex-col">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{course.title}</h3>
                  <span
                    className={`badge shrink-0 ${
                      course.is_published ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {course.is_published ? "Published" : "Draft"}
                  </span>
                </div>

                {isEnrolled && (
                  <span className="badge mb-3 w-fit bg-brand-50 text-brand-700">✓ Enrolled</span>
                )}

                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <Link to={`/dashboard/courses/${course.id}`} className="btn-secondary flex-1 text-center">
                    {isStaff ? "Manage" : isEnrolled ? "Continue" : "View details"}
                  </Link>

                  {isStaff && (
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => publishMutation.mutate({ id: course.id, publish: !course.is_published })}
                      disabled={publishMutation.isPending}
                    >
                      {course.is_published ? "Unpublish" : "Publish"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setServerError("");
        }}
        title="Create a new course"
      >
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input
            label="Title"
            placeholder="Intro to Community Health"
            error={errors.title?.message}
            {...register("title", { required: "Title is required" })}
          />
          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              className="input-field"
              placeholder="What will students learn?"
              {...register("description")}
            />
          </div>
          {categories.length > 0 && (
            <div>
              <label className="label">Category (optional)</label>
              <select className="input-field" {...register("category_id")}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create course"}
          </Button>
        </form>
      </Modal>

      <Modal open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="New category">
        <form onSubmit={categoryForm.handleSubmit(onCreateCategory)} className="space-y-4">
          <Input
            label="Category name"
            placeholder="Health, Technology, Agriculture..."
            error={categoryForm.formState.errors.name?.message}
            {...categoryForm.register("name", { required: "Required" })}
          />
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={createCategoryMutation.isPending}>
            {createCategoryMutation.isPending ? "Creating..." : "Create category"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
