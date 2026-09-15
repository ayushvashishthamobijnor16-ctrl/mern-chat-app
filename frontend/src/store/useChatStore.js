import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,

  isUsersLoading: false,
  isMessagesLoading: false,

  // Store the current socket listener
  messageListener: null,

  getUsers: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get("/messages/users");

      set({
        users: res.data,
      });
    } catch (error) {
      console.error(
        "Error fetching users:",
        error.response?.data?.message || error.message
      );
    } finally {
      set({
        isUsersLoading: false,
      });
    }
  },

  getMessages: async (userId) => {
    set({
      isMessagesLoading: true,
      messages: [],
    });

    try {
      const res = await axiosInstance.get(`/messages/${userId}`);

      set({
        messages: res.data,
      });
    } catch (error) {
      console.error(
        "Error fetching messages:",
        error.response?.data?.message || error.message
      );
    } finally {
      set({
        isMessagesLoading: false,
      });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();

    if (!selectedUser) return;

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // Add your own message immediately
      set({
        messages: [...messages, res.data],
      });
    } catch (error) {
      console.error(
        "Error sending message:",
        error.response?.data?.message || error.message
      );
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const selectedUser = get().selectedUser;

    if (!socket) {
      console.log("Cannot subscribe: Socket.IO is not connected");
      return;
    }

    if (!selectedUser) {
      console.log("Cannot subscribe: No user selected");
      return;
    }

    console.log(
      "Subscribed to messages from:",
      selectedUser.name
    );

    const handleNewMessage = (newMessage) => {
      console.log("New real-time message received:", newMessage);

      // Only show messages from the person we're currently chatting with
      const isFromSelectedUser =
        newMessage.senderId === selectedUser._id;

      if (!isFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    };

    socket.on("newMessage", handleNewMessage);

    set({
      messageListener: handleNewMessage,
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    const listener = get().messageListener;

    if (socket && listener) {
      socket.off("newMessage", listener);

      console.log("Unsubscribed from messages");
    }

    set({
      messageListener: null,
    });
  },

  setSelectedUser: (selectedUser) => {
    set({
      selectedUser,
      messages: [],
    });
  },
}));