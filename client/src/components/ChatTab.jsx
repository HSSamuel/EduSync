import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

// Connect to our backend WebSocket server
const socket = io.connect("http://localhost:5000");

const ChatTab = ({ userData }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const chatEndRef = useRef(null);

  // Auto-scroll to the bottom when a new message arrives
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  // Listen for incoming messages from the server
  useEffect(() => {
    const receiveMessageHandler = (data) => {
      setMessageList((list) => [...list, data]);
    };

    socket.on("receive_message", receiveMessageHandler);

    // Cleanup the listener when the component unmounts
    return () => {
      socket.off("receive_message", receiveMessageHandler);
    };
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (currentMessage.trim() !== "") {
      const messageData = {
        sender: userData.full_name, // You might need to add full_name to your /api/dashboard profile route if it's missing, or just use their role for now
        role: userData.your_role,
        message: currentMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Send the message to the backend via WebSockets
      await socket.emit("send_message", messageData);
      setCurrentMessage("");
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md z-10">
        <h4 className="text-xl font-bold flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Global School Lounge
        </h4>
        <p className="text-sm opacity-80">Live Chat</p>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 space-y-4">
        {messageList.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 italic">
            No messages yet. Be the first to say hello!
          </div>
        ) : (
          messageList.map((msg, index) => {
            // Determine if the message was sent by the current user
            const isMe =
              msg.sender === userData.full_name ||
              msg.role === userData.your_role; // simplified check

            return (
              <div
                key={index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-bl-none"
                  }`}
                >
                  <div className="flex justify-between items-baseline mb-1 gap-4">
                    <span
                      className={`text-xs font-bold ${isMe ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {msg.sender || msg.role}
                    </span>
                    <span
                      className={`text-[10px] ${isMe ? "text-blue-200" : "text-gray-400"}`}
                    >
                      {msg.time}
                    </span>
                  </div>
                  <p className="break-words">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input Area */}
      <form
        onSubmit={sendMessage}
        className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex gap-2"
      >
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 transition-all"
        />
        <button
          type="submit"
          disabled={!currentMessage.trim()}
          className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-md flex items-center justify-center w-12 h-12"
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatTab;
