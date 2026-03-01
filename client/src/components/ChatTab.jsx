import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Users, MessageSquare } from "lucide-react";

const socket = io.connect("http://localhost:5000");

const ChatTab = ({ userData }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [room, setRoom] = useState("Global Lounge");
  const chatEndRef = useRef(null);

  const availableRooms = ["Global Lounge", "Staff Room", "JSS 1", "SS 3"];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  // --- FIX: EMIT ROOM JOIN EVENT ON CHANGE ---
  useEffect(() => {
    socket.emit("join_room", room);
    setMessageList([]); // Clear screen when changing rooms
  }, [room]);

  useEffect(() => {
    const receiveMessageHandler = (data) => {
      setMessageList((list) => [...list, data]);
    };
    socket.on("receive_message", receiveMessageHandler);
    return () => {
      socket.off("receive_message", receiveMessageHandler);
    };
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (currentMessage.trim() !== "") {
      const messageData = {
        room: room, // Attach the room to direct the backend
        sender: userData.message.replace("Welcome back, ", "").replace("!", ""),
        role: userData.your_role,
        message: currentMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]); // Optimistic UI update
      setCurrentMessage("");
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 overflow-hidden">
      <div className="bg-blue-600 p-4 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
        <h4 className="text-xl font-bold flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Communications
        </h4>

        {/* Room Selector */}
        <div className="flex items-center gap-2 bg-blue-700/50 p-1.5 rounded-lg border border-blue-500/50 w-full sm:w-auto">
          <Users size={16} className="ml-2 text-blue-200" />
          <select
            className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer p-1 w-full sm:w-auto"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          >
            {availableRooms.map((r) => (
              <option key={r} value={r} className="text-gray-900">
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 space-y-4">
        {messageList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="italic font-medium text-sm">
              Welcome to {room}. Say hello!
            </p>
          </div>
        ) : (
          messageList.map((msg, index) => {
            const isMe =
              msg.sender ===
              userData.message.replace("Welcome back, ", "").replace("!", "");
            return (
              <div
                key={index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-none"}`}
                >
                  <div className="flex justify-between items-baseline mb-1 gap-4">
                    <span
                      className={`text-xs font-bold ${isMe ? "text-blue-200" : "text-gray-500"}`}
                    >
                      {msg.sender}{" "}
                      <span className="opacity-70 font-normal">
                        ({msg.role})
                      </span>
                    </span>
                    <span
                      className={`text-[10px] ${isMe ? "text-blue-200" : "text-gray-400"}`}
                    >
                      {msg.time}
                    </span>
                  </div>
                  <p className="break-words text-sm md:text-base leading-relaxed">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-3"
      >
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder={`Message ${room}...`}
          className="flex-1 px-5 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 text-sm font-medium"
        />
        <button
          type="submit"
          disabled={!currentMessage.trim()}
          className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 shadow-md flex items-center justify-center w-12 h-12 shrink-0"
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatTab;
