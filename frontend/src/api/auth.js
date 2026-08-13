import api from "./axios";

export const login = (email, password) =>
  api.post("/api/auth/login", { email, password }).then((res) => res.data);

export const signup = (fullName, email, password, role = "student") =>
  api
    .post("/api/auth/signup", { full_name: fullName, email, password, role })
    .then((res) => res.data);

export const forgotPassword = (email) =>
  api.post("/api/auth/forgot-password", { email }).then((res) => res.data);

export const fetchMe = () => api.get("/api/auth/me").then((res) => res.data);
