import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:5001/api"
      : " https://mern-chat-app-0oml.onrender.com",
  withCredentials: true,
});