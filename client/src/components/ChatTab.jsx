import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Users, MessageSquare, Send, Loader2 } from "lucide-react";
import { apiFetch, getAccessToken } from "../utils/api";

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = API_URL
  ? API_URL.replace("/api", "")
  : "http://localhost:5000";

const ChatTab = ({ userData }) => {
  const [socket, setSocket] = useState(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [room, setRoom] = useState("Global Lounge");
  const [historyLoading, setHistoryLoading] = useState(false);
  const chatEndRef = useRef(null);

  const availableRooms = ["Global Lounge", "Staff Room", "JSS 1", "SS 3"];
  const userName = userData?.full_name || "Me";

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  // 1) Initialize Socket (auth via token)
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
    });

    setSocket(newSocket);

    newSocket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    return () => {
      newSocket.off("receive_message");
      newSocket.close();
    };
  }, []);

  // 2) Load History and Join Room
  useEffect(() => {
    if (!socket) return;

    const loadHistoryAndJoin = async () => {
      setHistoryLoading(true);

      try {
        // apiFetch handles auth + refresh automatically
        const safeRoom = encodeURIComponent(room);

        const res = await apiFetch(`/chat/history/${safeRoom}`, {
          method: "GET",
        });

        if (res.ok) {
          const history = await res.json();
          setMessageList(Array.isArray(history) ? history : []);
        } else {
          const err = await res.json().catch(() => ({}));
          console.error("Failed to load chat history:", err);
          setMessageList([]);
        }
      } catch (err) {
        console.error("Failed to load history", err);
        setMessageList([]);
      } finally {
        setHistoryLoading(false);
        socket.emit("join_room", room);
      }
    };

    loadHistoryAndJoin();
  }, [room, socket]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (currentMessage.trim() !== "" && socket) {
      const messageData = {
        room: room,
        message: currentMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      socket.emit("send_message", messageData);
      setCurrentMessage("");
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
        <h4 className="text-xl font-bold flex items-center gap-2">
          Live Communications
        </h4>

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

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 space-y-4">
        {historyLoading ? (
          <div className="h-full flex items-center justify-center text-blue-600">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : messageList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="italic font-medium text-sm">
              Welcome to {room}. Say hello!
            </p>
          </div>
        ) : (
          messageList.map((msg, index) => {
            const isMe = msg.sender === userName;

            return (
              <div
                key={msg.id || index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-none"
                  }`}
                >
                  <div className="flex justify-between items-baseline mb-1 gap-4">
                    <span
                      className={`text-xs font-bold ${
                        isMe ? "text-blue-200" : "text-gray-500"
                      }`}
                    >
                      {isMe ? "You" : msg.sender} ({msg.role})
                    </span>

                    <span
                      className={`text-[10px] ${
                        isMe ? "text-blue-200" : "text-gray-400"
                      }`}
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

      {/* Composer */}
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
          className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 shadow-md flex items-center justify-center w-12 h-12 shrink-0 transition-colors"
        >
          <Send size={20} className="ml-1" />
        </button>
      </form>
    </div>
  );
};

export default ChatTab;
