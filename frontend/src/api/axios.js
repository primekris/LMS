import axios from "axios";

// Empty string => same-origin relative requests, proxied by Vite in dev
// (see vite.config.js) and served from the same domain (or reverse-proxied)
// in production. Set VITE_API_BASE_URL only if the frontend and backend
// live on different domains (e.g. separate Render services).
const baseURL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Downloads an authenticated file response (e.g. CSV export) as a real
// browser download, since a plain <a href> can't carry the auth header.
export async function downloadFile(url, filename) {
  const response = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
