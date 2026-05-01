import axios from "axios";
import { AUTH_KEY } from "../components/RequireAuth.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASEURL;

// axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// 🔐 auto token attach
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
