import { data, useNavigate } from "react-router-dom";
import { authService, authService as result } from "../services/authService";
import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import PrivateChat from ".PrivateChat/";
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
              setOnlineUsers((prev) => {
                const newUsers = new Set(prev);
                if (chatMessage.type === "JOIN") {
                  newUsers.add(chatMessage.sender);
                } else if (chatMessage.type === "LEAVE") {
                  newUsers.delete(chatMessage.sender);
                }
                return newUsers;
              });
              if (chatMessage.type === "TYPING") {
                setIsTyping(chatMessage.sender);
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  setIsTyping("");
                }, 2000);
                return;
              }

              setMessages((prev) => [
                ...prev,
                {
                  ...chatMessage,
                  timestamp: chatMessage.timestamp || new Date().toISOString(),
                  id: chatMessage.id || Date.now() + Math.random(),
                },
              ]);
            }
          );

          const PrivateChat = stompClient.current.subscribe(
            `/user/${username}/queue/private`,
            (msg) => {
              const privateMessage = JSON.parse(msg.body);
              const otherUser =
                privateMessage.sender === username
                  ? privateMessage.recepient
                  : privateMessage.sender;

              const handler = privateMessageHandlers.current.get(otherUser);

              if (handler) {
                try {
                  handler(privateMessage);
                } catch (error) {
                  console.error("Error calling handler", error);
                }
              } else if (privateMessage.recepient === username) {
                setUnreadMessages((prev) => {
                  const newUnread = new Map();
                  const currentCount = newUnread.get(otherUser) || 0;
                  newUnread.set(otherUser, currentCount + 1);
                  return newUnread;
                });
              }
            }
          );

          stompClient.current.send(
            "/app/chat.addUser",
            {},
            JSON.stringify({
              username: username,
              type: "JSON",
              color: userColor,
            })
          );

          authService
            .getOnlineUsers()
            .then((data) => {
              const fetchedUsers = Object.keys(data); // it is trying to make username as the keys but my backend api is sening data in different format
              setOnlineUsers((prev) => {
                const mergedSet = new Set(prev);
                fetchedUsers.forEach((user) => mergedSet.add(user));
                mergedSet.add(username);
                return mergedSet;
              });
            })
            .catch((error) => {
              console.error("Error fetching online users", error);
            });
        },
        (error) => {
          console.error("Stomp Connection Error", error);
          if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
              connectAndFetch();
            }, 5000);
          }
        }
      );
    };

    connectAndFetch();
    return () => {
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.disconnect();
      }
      clearTimeout(typingTimeoutRef.current);
      clearInterval(reconnectInterval);
    };
  }, [
    username,
    userColor,
    registerPrivateMessageHandler,
    unregisterPrivateMessageHandler,
  ]);

  const openPrivateChat = (otherUser) => {
    if (otherUser === username) return;

    setPrivateChat((prev) => {
      const newChats = new Map(prev);
      newChats.set(otherUser, true);
      return newChats;
    });

    setUnreadMessages((prev) => {
      const newUnread = new Map(prev);
      newUnread.delete(otherUser);
      return newUnread;
    });
  };

  const closePrivateChat = (otherUser) => {
    setPrivateChat((prev) => {
      const newChats = new Map(prev);
      newChats.delete(otherUser);
      return newChats;
    });
    unregisterPrivateMessageHandler(otherUser);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (
      message.trim() &&
      stompClient.current &&
      stompClient.current.connected
    ) {
      const chatMessage = {
        sender: username,
        content: message,
        type: "CHAT",
        color: userColor,
      };

      stompClient.current.send(
        "/app/chat.sendMessage",
        {},
        JSON.stringify(chatMessage)
      );
      setMessage("");
      setShowEmojiPicker(false);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (
      stompClient.current &&
      stompClient.current.connected &&
      e.target.value.trim()
    ) {
      stompClient.current.send(
        "/app/chat.sendMessage",
        {},
        JSON.stringify({
          sender: username,
          type: "TYPING",
        })
      );
    }
  };

  const addEmoji = (emoji) => {
    setMessage((prev) => {
      prev + emoji;
    });
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Users</h2>
        </div>
        <div className="user-list">
          {Array.from(onlineUsers).map((user) => {
            <div
              key={user}
              className={`user-item ${user === username ? "current-user" : ""}`}
              onClick={() => openPrivateChat(user)}
            >
              <div
                className="user-avatar"
                style={{
                  backgroundColor: user === username ? userColor : "#007bff",
                }}
              >
                {user.charAt(0).toUpperCase()}
              </div>

              <span>{user}</span>
              {user === username && <span className="you-label">(You)</span>}
              {unreadMessages.has(user) && (
                <span className="unread-count">{unreadMessages.get(user)}</span>
              )}
            </div>;
          })}
        </div>
      </div>
      <div className="main-chat">
        <div className="chat-header">
          <h4>Welcome, {username}</h4>
        </div>

        <div className="message-container">
          {messages.map((msg) => {
            <div key={msg.id} className={`message ${msg.type.toLowerCase()}`}>
              {msg.type === "JOIN" && (
                <div className="system-message">
                  {msg.sender} Joined the Group
                </div>
              )}

              {msg.type === "LEAVE" && (
                <div className="system-message">
                  {msg.sender} left the group
                </div>
              )}

              {msg.type === "CHAT" && (
                <div
                  className={`chat-message ${
                    msg.sender === username ? "own-message" : ""
                  }`}
                >
                  <div className="message-info">
                    <span
                      className="sender"
                      style={{ color: msg.color || "#007bff" }}
                    >
                      {msg.sender}
                    </span>
                    <span className="time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="message-text">{msg.content}</div>
                </div>
              )}
            </div>;
          })}

          {isTyping && isTyping !== username && (
            <div className="typing-indicator">{isTyping} is Typing</div>
          )}

          <div ref={messagesEndRef}></div>
        </div>

        <div className="input-area">
          {showEmojiPicker && (
            <div className="emoji-picker">
              {emojis.map((emoji) => {
                <button key={emoji} onClick={() => addEmoji(emoji)}>
                  {emoji}
                </button>;
              })}
            </div>
          )}

          <form onSubmit={sendMessage} className="message-form">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="emoji-btn"
            >
              😃
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
              className="message-input"
              maxLength={500}
            />

            <button
              type="submit"
              className="send-btn"
              disabled={message.trim()}
            ></button>
          </form>
        </div>
      </div>
      {Array.from(privateChat.keys()).map((otherUser) => {
        <PrivateChat
          key={otherUser}
          currentUser={username}
          recepientUser={otherUser}
          userColor={userColor}
          stompClient={stompClient}
          onClose={() => closePrivateChat(otherUser)}
          registerPrivateMessageHandler={registerPrivateMessageHandler}
          unregisterPrivateMessageHandler={unregisterPrivateMessageHandler}
        />;
      })}
    </div>
  );
};

export default ChatArea;
