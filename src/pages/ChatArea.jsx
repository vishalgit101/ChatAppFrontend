import { useNavigate } from "react-router-dom";
import { authService as result } from "../services/authService";
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ChatArea = () => {
  const navigate = useNavigate();
  const currentUser = result.getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
  }, [currentUser, navigate]);

  const [message, setMessage] = useState(""); // single message that's being typed
  const [messages, setMessages] = useState([]); // list of messages
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState("");
  const [privateChat, setPrivateChat] = useState(new Map());
  const [unreadMessages, setUnreadMessages] = useState(new Map());
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const privateMessageHandlers = useRef(new Map());
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const emojis = [
    "😃",
    "😂",
    "🌟",
    "🤩",
    "✨",
    "😋",
    "😘",
    "😅",
    "😎",
    "😓",
    "😥",
    "😶",
    "🤗",
    "😲",
    "🤑",
    "😢",
    "😭",
    "🎈",
    "🎇",
    "🎃",
    "❤",
    "🍟",
    "🤞",
    "🔥",
  ];

  if (!currentUser) {
    return null;
  }

  const { username, color: userColor } = currentUser;

  // scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behaviour: "smooth" });
  };

  const registerPrivateMessageHandler = useCallback((otherUser, handler) => {
    //add/replace a handler function for a specific user.
    privateMessageHandlers.current.set(otherUser, handler); // current is used to access the value of the ref hook
  }, []);

  const unregisterPrivateMessageHandler = useCallback((otherUser) => {
    privateMessageHandlers.current.delete(otherUser);
  }, []);

  useEffect(() => {
    let reconnectInterval;

    const connectAndFetch = async () => {
      if (!username) {
        return;
      }

      setOnlineUsers((prev) => {
        const prevSet = new Set(prev);
        prevSet.add(username);
        return prevSet;
      });

      const socket = new SockJS(`${backendUrl}/ws`);
      stompClient.current = Stomp.over(socket);

      stompClient.current.connect(
        {
          "client-id": username,
          "session-id": Date.now().toString(),
          username: username,
        },
        /*frame*/ () => {
          clearInterval(reconnectInterval);
          const GroupChat = stompClient.current.subscribe(
            "/topic/public",
            (msg) => {
              const chatMessage = JSON.parse(msg.body);
              setOnlineUsers((prev) => {});
            }
          );
        }
      );
    };
  });
};
