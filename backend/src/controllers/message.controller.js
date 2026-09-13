import User from "../models/user.js";
import Message from "../models/message.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { groq } from "../lib/groq.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAutocomplete = async (req, res) => {
  try {
    const { text } = req.body;
    console.log("Autocomplete request received, text:", text);

    if (!text || text.trim().length < 2) {
      return res.status(200).json({ suggestion: "" });
    }

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are an autocomplete engine for a chat app. Given the user's partial message, suggest a short, natural continuation (a few words, not a full new sentence). Only respond with the continuation text, nothing else. No quotes, no explanation.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
      reasoning_effort: "low",
    });

    const suggestion = completion.choices[0]?.message?.content?.trim() || "";
    console.log("Autocomplete suggestion generated:", suggestion);
    res.status(200).json({ suggestion });
  } catch (error) {
    console.error("Error in getAutocomplete:", error.message);
    res.status(500).json({ suggestion: "" });
  }
};