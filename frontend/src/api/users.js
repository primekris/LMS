import api from "./axios";

export const listUsers = () => api.get("/api/users").then((res) => res.data);

export const createModerator = (payload) =>
  api.post("/api/users/moderators", payload).then((res) => res.data);

export const updatePermissions = (userId, permissions) =>
  api.patch(`/api/users/moderators/${userId}/permissions`, { permissions }).then((res) => res.data);

export const promoteUser = (userId, role) =>
  api.patch(`/api/users/${userId}/role`, { role }).then((res) => res.data);

export const setUserActive = (userId, isActive) =>
  api.patch(`/api/users/${userId}/active`, null, { params: { is_active: isActive } }).then((res) => res.data);
