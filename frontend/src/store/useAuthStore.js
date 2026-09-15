import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : "https://mern-chat-app-0oml.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,

  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,

  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({
        authUser: res.data,
      });

      get().connectSocket();
    } catch (error) {
      set({
        authUser: null,
      });
    } finally {
      set({
        isCheckingAuth: false,
      });
    }
  },

  signup: async (data) => {
    set({
      isSigningUp: true,
    });

    try {
      const res = await axiosInstance.post("/auth/signup", data);

      set({
        authUser: res.data,
      });

      get().connectSocket();
    } catch (error) {
      console.error(
        "Signup error:",
        error.response?.data?.message || error.message
      );
    } finally {
      set({
        isSigningUp: false,
      });
    }
  },

  login: async (data) => {
    set({
      isLoggingIn: true,
    });

    try {
      const res = await axiosInstance.post("/auth/login", data);

      set({
        authUser: res.data,
      });

      get().connectSocket();
    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data?.message || error.message
      );
    } finally {
      set({
        isLoggingIn: false,
      });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");

      get().disconnectSocket();

      set({
        authUser: null,
      });
    } catch (error) {
      console.error(
        "Logout error:",
        error.response?.data?.message || error.message
      );
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser) return;

    if (socket?.connected) return;

    console.log("Connecting Socket.IO...");

    const newSocket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },

      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({
        onlineUsers: userIds,
      });
    });

    set({
      socket: newSocket,
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;

    if (socket) {
      socket.disconnect();
    }

    set({
      socket: null,
      onlineUsers: [],
    });
  },
}));