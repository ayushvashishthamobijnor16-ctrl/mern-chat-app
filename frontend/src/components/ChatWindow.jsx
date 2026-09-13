import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";

function ChatWindow() {
  const {
    selectedUser,
    messages,
    getMessages,
    sendMessage,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const messageEndRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    setSuggestion("");

    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) return;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axiosInstance.post("/messages/autocomplete", { text: value });
        setSuggestion(res.data.suggestion);
      } catch (error) {
        setSuggestion("");
      }
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab" && suggestion) {
      e.preventDefault();
      setText((prev) => prev + " " + suggestion);
      setSuggestion("");
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage({ text });
    setText("");
    setSuggestion("");
  };

  if (isMessagesLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading messages...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b font-bold">{selectedUser.name}</div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`max-w-xs p-2 rounded-lg ${
              msg.senderId === authUser._id
                ? "bg-blue-600 text-white self-end"
                : "bg-gray-200 self-start"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t flex flex-col gap-1">
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full border rounded p-2"
          />
          {suggestion && (
            <span className="absolute left-0 top-0 p-2 text-gray-400 pointer-events-none">
              <span className="invisible">{text} </span>
              {suggestion}
            </span>
          )}
        </div>
        {suggestion && (
          <span className="text-xs text-gray-400">Press Tab to accept suggestion</span>
        )}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded self-end">
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;