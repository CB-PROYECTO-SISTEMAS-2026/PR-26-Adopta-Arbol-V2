import axios from "axios";
import { API_URL } from "../config/api.config.js";

export const loginRequest = async (credentials) => {
  return await axios.post(`${API_URL}/login`, credentials);
};

export const getUsersRequest = async () => {
  return await axios.get(`${API_URL}/users`);
};

export const createUserRequest = async (user) => {
  return await axios.post(`${API_URL}/users`, user);
};

export const deleteUserRequest = async (id, deletedBy) => {
  return await axios.delete(`${API_URL}/users/${id}`, {
    data: { deletedBy }
  });
};

export const registerUserRequest = async (userData) => {
  return await axios.post(`${API_URL}/register`, userData);
};

export const acceptUserRequest = async (id, acceptedBy) => {
  return await axios.put(`${API_URL}/users/accept/${id}`, { acceptedBy });
};

export const getUserByIdRequest = async (id) => {
  return await axios.get(`${API_URL}/users/${id}`);
};

export const refreshUserDataRequest = async (id) => {
  return await axios.get(`${API_URL}/users/${id}`);
};