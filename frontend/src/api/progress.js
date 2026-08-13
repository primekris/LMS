import api from "./axios";

export const getCourseProgress = (courseId) =>
  api.get(`/api/progress/courses/${courseId}`).then((res) => res.data);

export const markLessonComplete = (lessonId) =>
  api.post(`/api/progress/lessons/${lessonId}/complete`).then((res) => res.data);
