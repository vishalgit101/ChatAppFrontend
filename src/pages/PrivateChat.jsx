import { useEffect, useState } from "react";

const PrivateChat = ({
  currentUser,
  recipientUser,
  userColor,
  stompClient,
  onClose,
  registerPrivateMessageHandler,
  unregisterPrivateMessageHandler,
}) => {
  const backendUrl = import.meta.VITE_BACKEND_URL;

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState();
  const messageEndRef = useRef();
  const messageIdRef = useRef(new Set());

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behaviour: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createMessageId = (msg) => {
    return `${msg.sender}-${msg.recipient}-${msg.content}-${msg.timestamp}`;
  };

  useEffect(() => {
    let isMounted = true;

    const loadMessageHistory = async () => {
      try {
        const response = await fetch(
          `${backendUrl}/api/messages/private?user2=${recipientUser}`
        );

        if (response.ok && isMounted) {
          const history = await response.json();
          const processedHistory = history.map((msg) => {
            const messageId = msg.id || createMessageId(msg);
            return {
              ...msg,
              id: messageId,
            };
          });

          messageIdRef.current.clear();
          processedHistory.forEach((msg) => {
            messageIdRef.current.add(msg.id);
          });
          setMessages(processedHistory);
        }
      } catch (error) {
        console.error("Error loading message history", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMessageHistory();
    registerPrivateMessageHandler(recipientUser, handleIncomingPrivateMessage);

    const handleIncomingPrivateMessage = (privateMessage) => {
      const messageId = privateMessage.id || createMessageId(privateMessage);
      const isOwnMessage = privateMessage.sender === currentUser;

      const isRelevantMessage =
        (privateMessage.sender === currentUser &&
          privateMessage.recipient === recipientUser) ||
        (privateMessage.sender === recipientUser &&
          privateMessage.recipient === currentUser);

      if (isRelevantMessage && !isOwnMessage) {
        if (!messageIdRef.current.has(messageId)) {
          const newMessage = {
            ...privateMessage,
            id: messageId,
          };

          messageIdRef.current.add(messageId);
          setMessage((prev) => [...prev, newMessage]);
        }
      }
    };

    const sendPrivateMessage = (e) => {
      e.preventDefault();

      if (message.trimEnd() && stompClient.current && stomp.current.connected) {
        const timestamp = new Date();
        const privateMessage = {
          sender: currentUser,
          recipient: recipientUser,
          content: message.trim(),
          type: "PRIVATE_MESSAGE",
          color: userColor,
          timestamp: timestamp,
        };

        const messageId = createMessageId(privateMessage);
        const messageWithId = {
          ...privateMessage,
          id: messageId,
        };

        if (!messageIdRef.current.has(messageId)) {
          messageIdRef.current.add(messageId);
          setMessages((prev) => [...prev, messageWithId]);
        }

        try {
          if (stompClient.current.connected) {
            stompClient.current.send(
              "/app/chat.sendMessage",
              {}.JSON.stringify(privateMessage)
            );
            setMessages("");
          } else {
            setMessages((prev) => {
              prev.filter((msg) => {
                msg.id !== messageId;
                messageIdRef.current.delete(messageId);
              });
            });
          }
        } catch (error) {
          console.error("Error sending message", error);
          setMessages((prev) =>
            prev.filter((msg) => {
              msg.id !== messageId;
            })
          );
          messageIdRef.current.delete(messageId);
        }
      }
    };

    const formatTime = (timestamp) => {
      // formatTime
      return new Date(timestamp).toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    if (loading) {
      return (
        <div className="private-chat-window">
          <div className="private-chat-header">
            <h3>{recipientUser}</h3>
            <button onClick={onClose} className="close-btn"></button>
          </div>
          <div className="loading">Loading messages...</div>
        </div>
      );
    }

    return () => {
      isMounted = false;
      unregisterPrivateMessageHandler(recipientUser);
    };
  }, [
    currentUser,
    recipientUser,
    registerPrivateMessageHandler,
    unregisterPrivateMessageHandler,
  ]);

  return (
    <div className="private-chat-window">
      <div className="private-chat-header">
        <div className="recipient-info">
          <div className="recipient-avatar">
            {recipientUser.charAt(0).toUpperCase()}
          </div>
          <h3>{recipientUser}</h3>
        </div>
        <button onClick={onClose} className="close-btn">
          close
        </button>
      </div>

      <div className="private-message-container">
        {message.length === 0 ? (
          <div className="no-message">
            <p> No message yet. Start the conversation !! </p>
          </div>
        ) : (
          message.map((msg) => {
            <div
              key={msg.id}
              className={`private-message ${
                msg.sender === currentUser ? "own-message" : "received-message"
              }`}
            >
              <div className="message-header">
                <span
                  className="sender-name"
                  style={{ color: msg.color } || "#6b73FF"}
                >
                  {msg.sender === currentUser ? "You" : msg.sender}
                </span>
                <span className="timestamp">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>;
          })
        )}

        <div ref={messageEndRef}></div>
      </div>

      <div className="private-message-input-container">
        <form onSubmit={sendPrivateMessage} className="private-message-form">
          <input
            type="text"
            placeholder={`Message ${recipientUser}...`}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            className="private-message-input"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={message.trim()}
            className="private-send-button"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrivateChat;
