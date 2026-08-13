import api from "./axios";

export const userStats = () => api.get("/api/stats/users").then((res) => res.data);
export const courseStats = () => api.get("/api/stats/courses").then((res) => res.data);
