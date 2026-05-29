"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Phone, MessageSquare, X, Send, ChevronLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";
import { usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/components/ui/ToastContext";

export function FloatingChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<"menu" | "chat">("menu");
  const [message, setMessage] = useState("");
  const pathname = usePathname();
  const toast = useToast();


  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, activeView]);

  useEffect(() => {
    if (activeView === "chat" && isAuthenticated && user) {
      setIsLoading(true);
      const newSocket = io(API_BASE_URL, {
        withCredentials: true,
      });

      const fetchHistory = async () => {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/chat/conversation`);
          const data = await res.json();
          if (data.success && data.data) {
            setConversationId(data.data.conversation._id);
            setChatHistory(data.data.messages || []);
            if (newSocket.connected) {
              newSocket.emit("join_conversation", { conversationId: data.data.conversation._id });
            }
          }
        } catch (error) {
          console.error("Lỗi lấy lịch sử chat:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchHistory();

      newSocket.on("connect", () => {
        setConversationId((currentId) => {
          if (currentId) {
            newSocket.emit("join_conversation", { conversationId: currentId });
          }
          return currentId;
        });
      });

      newSocket.on("connect_error", (err) => {
        console.error("Lỗi kết nối Socket:", err.message);
        setIsLoading(false);
      });

      newSocket.on("receive_message", (msg) => {
        setChatHistory(prev => {
          // Xoá tin nhắn optimistic nếu nó bị trùng
          const filtered = prev.filter(m => m._id !== msg._id && m.content !== msg.content);
          return [...filtered, msg];
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [activeView, isAuthenticated, user]);

  const handleSend = () => {
    if (!message.trim() || !socket || !conversationId) return;
    
    const roleString = user?.role === 'admin' ? 'ADMIN' : 'CUSTOMER';
    const tempId = Date.now().toString();
    const newMessage = {
      _id: tempId,
      senderRole: roleString,
      senderId: user?.id,
      content: message.trim(),
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
      sender: { name: user?.name, avatar: user?.avatar }
    };
    
    setChatHistory(prev => [...prev, newMessage]);
    
    socket.emit("send_message", { 
      conversationId, 
      content: message.trim() 
    });
    
    setMessage("");
  };

  // Ẩn nút chat nếu đang ở trang Admin
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-[90] flex flex-col items-end">
      {/* Popup Window */}
      <div 
        className={`bg-white rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] border border-[#e2e8f0] overflow-hidden transition-all duration-300 origin-bottom-right mb-4 ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-75 opacity-0 pointer-events-none absolute bottom-full right-0'
        }`}
        style={{ width: '320px', height: '420px' }}
      >
        {activeView === "menu" ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2e4c7e] to-[#e8b4ae] p-6 text-center relative">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-md p-1">
                <Image src="/images/logo.png" alt="Logo" width={48} height={48} className="object-contain" />
              </div>
              <h3 className="text-white font-serif text-lg">Hỗ Trợ Khách Hàng</h3>
              <p className="text-white/90 text-xs mt-1 font-light">Khảm Hoa luôn sẵn sàng lắng nghe bạn.</p>
            </div>

            {/* Menu Options */}
            <div className="flex-1 p-5 space-y-3 bg-[#faf8f6]">
              <a 
                href="tel:0965491328"
                className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#e2e8f0] hover:border-[#2e4c7e]/50 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[#333] font-medium text-sm">Gọi Hotline</h4>
                  <p className="text-[#777] text-xs mt-0.5">0965.491.328</p>
                </div>
              </a>

              <a 
                href="https://zalo.me/0965491328"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#e2e8f0] hover:border-[#0068ff]/30 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0068ff] flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">
                  Zalo
                </div>
                <div>
                  <h4 className="text-[#333] font-medium text-sm">Chat qua Zalo</h4>
                  <p className="text-[#777] text-xs mt-0.5">Phản hồi nhanh chóng</p>
                </div>
              </a>

              <button 
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error("Vui lòng đăng nhập để sử dụng tính năng Chat Trực Tiếp.");
                    setTimeout(() => window.location.href = "/login", 1000);
                    return;
                  }
                  setActiveView("chat");
                }}
                className="w-full flex items-center gap-4 bg-white p-4 rounded-xl border border-[#e2e8f0] hover:border-[#2e4c7e]/50 hover:shadow-md transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-full bg-[#2e4c7e]/10 text-[#2e4c7e] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[#333] font-medium text-sm">Chat Trực Tiếp</h4>
                  <p className="text-[#777] text-xs mt-0.5">Tư vấn viên trực tuyến</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-[#faf8f6]">
            {/* Chat Header */}
            <div className="bg-[#2e4c7e] p-4 flex items-center justify-between text-white shadow-sm z-10">
              <button 
                onClick={() => setActiveView("menu")}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-8 h-8 bg-white rounded-full p-0.5">
                    <Image src="/images/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#2e4c7e] rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-serif text-sm">Khảm Hoa Store</h3>
                  <p className="text-[10px] text-white/80">Trực tuyến</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {!isAuthenticated ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 bg-[#eef2f6] rounded-full flex items-center justify-center text-[#2e4c7e] mb-2">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif text-[#0B2545] font-medium text-lg">Đăng nhập để Chat</h4>
                  <p className="text-sm text-[#0B2545]/60 mb-4">
                    Vui lòng đăng nhập để kết nối trực tiếp với chuyên viên tư vấn của Khảm Hoa.
                  </p>
                  <a href="/login?redirect=/" className="bg-[#2e4c7e] hover:bg-[#1b2a4a] text-white px-8 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-md">
                    Đăng Nhập Ngay
                  </a>
                </div>
              ) : isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2e4c7e]" />
                </div>
              ) : (
                <>
                  {chatHistory.length === 0 && (
                    <div className="text-center text-xs text-gray-400 my-4">
                      Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện.
                    </div>
                  )}
                  {chatHistory.map((msg) => (
                    <div key={msg._id} className={`flex flex-col max-w-[85%] ${msg.senderRole === "CUSTOMER" ? "self-end items-end" : "self-start items-start"}`}>
                      <div 
                        className={`px-4 py-2.5 rounded-2xl text-sm ${
                          msg.senderRole === "CUSTOMER" 
                            ? "bg-[#2e4c7e] text-white rounded-br-sm shadow-sm" 
                            : "bg-white text-[#333] border border-[#e2e8f0] rounded-bl-sm shadow-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-[#999] mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white border-t border-[#e2e8f0]">
              <div className="flex items-center bg-[#faf8f6] rounded-full px-4 py-2 border border-[#e8d8c3]/50 focus-within:border-[#2e4c7e] transition-colors">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-[#333] placeholder:text-[#999]"
                />
                <button 
                  onClick={handleSend}
                  disabled={!message.trim() || !isAuthenticated || !socket}
                  className="text-[#2e4c7e] hover:text-[#1b2a4a] disabled:opacity-50 disabled:hover:text-[#2e4c7e] transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#2e4c7e] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#2e4c7e]/40 hover:bg-[#1b2a4a] hover:-translate-y-1 transition-all duration-300 relative group z-50"
        aria-label="Mở cửa sổ chat"
      >
        {/* Pulsing effect when closed */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-[#2e4c7e] animate-ping opacity-20 group-hover:opacity-0" />
        )}
        
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
