import api from "./axios";

export const issueCertificate = (studentId, courseId) =>
  api.post("/api/certificates", { student_id: studentId, course_id: courseId }).then((res) => res.data);

export const myCertificates = () => api.get("/api/certificates/me").then((res) => res.data);

export const verifyCertificate = (code) => api.get(`/api/certificates/verify/${code}`).then((res) => res.data);
