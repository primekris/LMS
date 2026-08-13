import api from "./axios";

export const listForLesson = (lessonId) =>
  api.get(`/api/assignments/lesson/${lessonId}`).then((res) => res.data);

export const createAssignment = (payload) => api.post("/api/assignments", payload).then((res) => res.data);

export const submitAssignment = (assignmentId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post(`/api/assignments/${assignmentId}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
};

export const listSubmissions = (assignmentId) =>
  api.get(`/api/assignments/${assignmentId}/submissions`).then((res) => res.data);

export const mySubmissions = () => api.get("/api/assignments/submissions/me").then((res) => res.data);

export const gradeSubmission = (submissionId, grade, feedback) =>
  api.patch(`/api/assignments/submissions/${submissionId}/grade`, { grade, feedback }).then((res) => res.data);
