import axios from "axios";
import { API_URL } from "../config/api.config.js";

export const getCategories = async () => {
  const res = await axios.get(`${API_URL}/categories`);
  return res.data;
};
export const registerTree = async (formData) => {
  const res = await axios.post(`${API_URL}/trees/register`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

