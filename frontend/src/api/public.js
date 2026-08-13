import api from "./axios";

export const publicStats = () => api.get("/api/public/stats").then((res) => res.data);
export const featuredCourses = () => api.get("/api/public/featured-courses").then((res) => res.data);
export const featuredCampaigns = () => api.get("/api/public/featured-campaigns").then((res) => res.data);
