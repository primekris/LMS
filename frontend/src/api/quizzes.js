import api from "./axios";

export const listQuizzesForCourse = (courseId) =>
  api.get(`/api/quizzes/course/${courseId}`).then((res) => res.data);

export const createQuiz = (payload) => api.post("/api/quizzes", payload).then((res) => res.data);

export const addQuestion = (quizId, payload) =>
  api.post(`/api/quizzes/${quizId}/questions`, payload).then((res) => res.data);

export const submitAttempt = (quizId, answers) =>
  api.post(`/api/quizzes/${quizId}/attempts`, { answers }).then((res) => res.data);

export const myAttempts = (quizId) => api.get(`/api/quizzes/${quizId}/my-attempts`).then((res) => res.data);
