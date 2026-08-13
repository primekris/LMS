import api from "./axios";

export const listCourses = (categoryId) =>
  api.get("/api/courses", { params: categoryId ? { category_id: categoryId } : {} }).then((res) => res.data);

export const getCourse = (id) => api.get(`/api/courses/${id}`).then((res) => res.data);

export const createCourse = (payload) => api.post("/api/courses", payload).then((res) => res.data);

export const publishCourse = (id) => api.post(`/api/courses/${id}/publish`).then((res) => res.data);

export const unpublishCourse = (id) => api.post(`/api/courses/${id}/unpublish`).then((res) => res.data);

export const addModule = (courseId, payload) =>
  api.post(`/api/courses/${courseId}/modules`, payload).then((res) => res.data);

export const addLesson = (moduleId, payload) =>
  api.post(`/api/courses/modules/${moduleId}/lessons`, payload).then((res) => res.data);

export const enrollInCourse = (courseId) =>
  api.post(`/api/enrollments/${courseId}`).then((res) => res.data);

export const myEnrollments = () => api.get("/api/enrollments/me").then((res) => res.data);

export const listCourseEnrollments = (courseId) =>
  api.get(`/api/courses/${courseId}/enrollments`).then((res) => res.data);

export const listCategories = () => api.get("/api/courses/categories").then((res) => res.data);

export const createCategory = (name) => api.post("/api/courses/categories", { name }).then((res) => res.data);
