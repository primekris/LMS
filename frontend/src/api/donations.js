import api from "./axios";

export const listCampaigns = () => api.get("/api/donations/campaigns").then((res) => res.data);

export const createCampaign = (payload) =>
  api.post("/api/donations/campaigns", payload).then((res) => res.data);

export const donateToCampaign = (campaignId, payload) =>
  api.post(`/api/donations/campaigns/${campaignId}/donate`, payload).then((res) => res.data);

export const donationSummary = () => api.get("/api/donations/summary").then((res) => res.data);

export const myDonations = () => api.get("/api/donations/me").then((res) => res.data);
