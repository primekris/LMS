import api from "./axios";

export const uploadFileResource = (lessonId, title, file) => {
  const formData = new FormData();
  formData.append("lesson_id", lessonId);
  formData.append("title", title);
  formData.append("file", file);
  return api
    .post("/api/resources/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
};

export const addLinkResource = (lessonId, title, externalUrl) =>
  api
    .post("/api/resources/link", { lesson_id: lessonId, title, external_url: externalUrl })
    .then((res) => res.data);
