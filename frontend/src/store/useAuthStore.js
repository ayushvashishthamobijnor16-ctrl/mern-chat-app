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

      set({ authUser: res.data });

      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });

    try {
      const res = await axiosInstance.post("/auth/signup", data);

      set({ authUser: res.data });

      get().connectSocket();
    } catch (error) {
      console.error(
        "Signup error:",
        error.response?.data?.message || error.message
      );
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });

    try {
      const res = await axiosInstance.post("/auth/login", data);

      set({ authUser: res.data });

      get().connectSocket();
    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data?.message || error.message
      );
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");

      set({ authUser: null });

      get().disconnectSocket();
    } catch (error) {
      console.error(
        "Logout error:",
        error.response?.data?.message || error.message
      );
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();

    // Don't connect if user isn't logged in
    // or socket is already connected
    if (!authUser || socket?.connected) return;

    const newSocket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });

    // io() automatically connects, so newSocket.connect()
    // is not needed here.

    set({ socket: newSocket });

    newSocket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;

    if (socket?.connected) {
      socket.disconnect();
    }

    set({
      socket: null,
      onlineUsers: [],
    });
  },
}));