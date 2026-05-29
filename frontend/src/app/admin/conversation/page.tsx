"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { 
  MessageSquare, Search, Clock, CheckCircle2, MoreVertical, X,
  Send, Loader2, Sparkles, Filter, AlertTriangle, Shield, Check, RotateCw, User, CheckCheck, XCircle, ChevronLeft, Phone, Mail 
} from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import { useConfirm } from "@/components/ui/ConfirmContext";

interface CustomerInfo {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
}

interface ConversationData {
  _id: string;
  customerId: CustomerInfo | null;
  status: "OPEN" | "CLOSED";
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

interface MessageData {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: "CUSTOMER" | "ADMIN";
  messageType: "TEXT" | "IMAGE";
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminConversationPage() {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [replyText, setReplyText] = useState("");
  
  // Status / Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  
  const toast = useToast();
  const { confirm } = useConfirm();
  
  // Realtime Socket states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch conversations listing
  const fetchConversations = async (isSilent = false) => {
    if (!isSilent) setLoadingList(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/chat/admin/conversations`);
      const data = await res.json();
      if (res.ok && data.success) {
        setConversations(data.data || []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách hội thoại:", err);
    } finally {
      setLoadingList(false);
    }
  };

  // 2. Fetch specific messages
  const fetchMessages = async (convId: string) => {
    setLoadingChat(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/chat/conversation/${convId}/messages`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(data.data || []);
        // Automatically mark as read locally and sync conversation unread counts
        setConversations(prev => 
          prev.map(c => c._id === convId ? { ...c, unreadCount: 0 } : c)
        );
      }
    } catch (err) {
      console.error("Lỗi lấy lịch sử chat:", err);
    } finally {
      setLoadingChat(false);
    }
  };

  // 3. Socket.IO Lifecycle Connection
  useEffect(() => {
    let activeSocket: Socket | null = null;

    const connectSocket = async () => {
      try {
        // Fetch secure socket token authorized by HttpOnly access token
        const tokenRes = await fetchWithAuth(`${API_BASE_URL}/api/users/socket-token`);
        const tokenData = await tokenRes.json();

        if (tokenRes.ok && tokenData.success && tokenData.token) {
          // Initialize Socket.IO connection targeting Express HTTP server
          const socketUrl = API_BASE_URL.replace("/api", ""); // e.g. http://localhost:5000
          activeSocket = io(socketUrl, {
            auth: { token: `Bearer ${tokenData.token}` },
            transports: ["websocket", "polling"]
          });

          activeSocket.on("connect", () => {
            console.log("🔌 Connected to Live Chat Socket Server successfully!");
          });

          // Online status indicators
          activeSocket.on("user_online", ({ userId }: { userId: string }) => {
            setOnlineUserIds(prev => new Set([...prev, userId]));
          });

          activeSocket.on("user_offline", ({ userId }: { userId: string }) => {
            setOnlineUserIds(prev => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            });
          });

          // Realtime new messages
          activeSocket.on("receive_message", (message: MessageData) => {
            // Append message if active conversation matches
            setMessages(prev => {
              if (prev.length > 0 && prev[0].conversationId === message.conversationId) {
                // Ensure duplicate checks are bypassed
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
              }
              return prev;
            });

            // Automatically trigger read notifications if active
            if (activeConv && activeConv._id === message.conversationId) {
              fetchWithAuth(`${API_BASE_URL}/api/chat/conversation/${message.conversationId}/read`, {
                method: "PUT"
              });
            } else {
              // Increment unread counter on the side listing card
              setConversations(prev => 
                prev.map(c => c._id === message.conversationId 
                  ? { ...c, unreadCount: c.unreadCount + 1, lastMessage: message.content, lastMessageAt: message.createdAt }
                  : c
                )
              );
            }
          });

          // System updates
          activeSocket.on("conversation_updated", ({ conversationId, lastMessage, lastMessageAt, unreadCount }: any) => {
            setConversations(prev => {
              const matched = prev.find(c => c._id === conversationId);
              if (matched) {
                return prev.map(c => c._id === conversationId 
                  ? { ...c, lastMessage, lastMessageAt, unreadCount: activeConv?._id === conversationId ? 0 : unreadCount } 
                  : c
                ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
              } else {
                // Fetch list clean if completely new customer initiates conversation
                fetchConversations(true);
                return prev;
              }
            });
          });

          setSocket(activeSocket);
        }
      } catch (err) {
        console.error("Lỗi xác thực socket connection:", err);
      }
    };

    connectSocket();
    fetchConversations();

    return () => {
      if (activeSocket) {
        activeSocket.disconnect();
      }
    };
  }, [activeConv?._id]);

  // 4. Room Join Bindings
  useEffect(() => {
    if (socket && activeConv) {
      // Join active support room
      socket.emit("join_conversation", { conversationId: activeConv._id });
      fetchMessages(activeConv._id);

      return () => {
        socket.emit("leave_conversation", { conversationId: activeConv._id });
      };
    }
  }, [activeConv?._id, socket]);

  // 5. Auto Scroll view
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 6. Submitting messages
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConv || !socket) return;

    // Emit live message over Socket room
    socket.emit("send_message", {
      conversationId: activeConv._id,
      content: replyText.trim(),
      messageType: "TEXT"
    });

    setReplyText("");
  };

  // 7. Closing Support Tickets
  const handleCloseTicket = () => {
    if (!activeConv) return;
    confirm({
      title: "Đóng Phiên Chat",
      message: "Bạn có chắc chắn muốn đóng phiên hỗ trợ này? Khách hàng có thể bắt đầu lại phiên mới bất cứ lúc nào.",
      variant: "info",
      onConfirm: async () => {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/chat/admin/conversation/${activeConv._id}/close`, {
            method: "PUT"
          });
          if (res.ok) {
            toast.success("Đã đóng phiên chat thành công.");
            setActiveConv(null);
            await fetchConversations();
          } else {
            toast.error("Lỗi khi đóng phiên chat.");
          }
        } catch (err) {
          toast.error("Lỗi kết nối đóng phiên chat.");
        }
      }
    });
  };

  // 8. Reopening Support Tickets
  const handleOpenTicket = async () => {
    if (!activeConv) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/chat/admin/conversation/${activeConv._id}/open`, {
        method: "PUT"
      });
      if (res.ok) {
        toast.success("Mở lại phiên chat thành công.");
        setActiveConv(prev => prev ? { ...prev, status: "OPEN" } : null);
        await fetchConversations();
      } else {
        toast.error("Lỗi khi mở lại phiên chat.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối mở phiên chat.");
    }
  };

  const getAvatarLetter = (name?: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  const formatChatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-[78vh] flex bg-[#1C1816] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md animate-in fade-in duration-500">
      
      {/* LEFT COLUMN: ACTIVE CONVERSATIONS (1/3 width) */}
      <div className={`w-full md:w-80 border-r border-white/[0.06] flex flex-col bg-[#171412] shrink-0 ${
        activeConv ? "hidden md:flex" : "flex"
      }`}>
        
        {/* Support Header */}
        <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-[#1C1816]/50">
          <div>
            <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#c9a15c]" /> HỖ TRỢ TRỰC TUYẾN
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Khách hàng kết nối thời gian thực</p>
          </div>
          <button 
            onClick={() => fetchConversations()}
            disabled={loadingList}
            className="p-2 text-gray-400 hover:text-[#c9a15c] hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loadingList ? "animate-spin text-[#c9a15c]" : ""}`} />
          </button>
        </div>

        {/* Conversation Listings */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] scrollbar-thin">
          {conversations.length > 0 ? (
            conversations.map((conv) => {
              const customer = conv.customerId;
              if (!customer) return null;
              
              const isSelected = activeConv?._id === conv._id;
              const isOnline = onlineUserIds.has(customer._id);

              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveConv(conv)}
                  className={`p-4 flex gap-3.5 items-start cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-white/[0.03] border-l-3 border-[#c9a15c]" 
                      : "hover:bg-white/[0.01]"
                  }`}
                >
                  {/* Customer Avatar Frame with Gold online badge */}
                  <div className="relative shrink-0 select-none">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#c9a15c] flex items-center justify-center font-serif text-[#14110F] font-black text-sm uppercase shadow border border-white/5">
                      {customer.avatar ? (
                        <img src={customer.avatar} alt={customer.name} className="w-full h-full object-cover" />
                      ) : (
                        getAvatarLetter(customer.name)
                      )}
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#1C1816] shadow" />
                    )}
                  </div>

                  {/* Info previews */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-baseline gap-1">
                      <h4 className={`text-xs font-bold truncate ${isSelected ? "text-[#c9a15c]" : "text-white"}`}>
                        {customer.name}
                      </h4>
                      {conv.lastMessageAt && (
                        <span className="text-[9px] text-gray-500 font-semibold uppercase">
                          {formatChatTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate leading-relaxed">
                      {conv.lastMessage || "Hội thoại trống"}
                    </p>
                    
                    {/* Customer indicators */}
                    <div className="flex justify-between items-center pt-1 select-none">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                        conv.status === "OPEN" ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-400"
                      }`}>
                        {conv.status}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-[#c9a15c] text-[#14110F] text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow animate-pulse">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-5 text-gray-500 space-y-2">
              <MessageSquare className="w-8 h-8 text-gray-600 stroke-[1.5]" />
              <p className="text-xs italic leading-relaxed">Chưa ghi nhận hội thoại hỗ trợ trực tuyến nào.</p>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: ACTIVE SUPPORT CONSOLE (2/3 width) */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#14110F]/45 ${
        !activeConv ? "hidden md:flex" : "flex"
      }`}>
        {activeConv && activeConv.customerId ? (
          <>
            {/* Support Box Header */}
            <div className="h-16 bg-[#1C1816]/70 px-6 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Back button for mobile drawer */}
                <button 
                  onClick={() => setActiveConv(null)}
                  className="flex md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-[#c9a15c] flex items-center justify-center font-serif text-[#14110F] font-black text-sm uppercase shrink-0">
                  {activeConv.customerId.avatar ? (
                    <img src={activeConv.customerId.avatar} alt={activeConv.customerId.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    getAvatarLetter(activeConv.customerId.name)
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate leading-none">{activeConv.customerId.name}</h4>
                  <span className="text-[9px] font-semibold text-gray-400 mt-1 flex items-center gap-1.5 leading-none select-all uppercase tracking-wider">
                    {onlineUserIds.has(activeConv.customerId._id) ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">● Đang hoạt động</span>
                    ) : (
                      <span className="text-gray-500 font-bold">○ Ngoại tuyến</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Ticket Action button */}
              {activeConv.status === "OPEN" ? (
                <button
                  onClick={handleCloseTicket}
                  className="px-4 py-1.5 text-rose-400 hover:text-white hover:bg-rose-600/10 border border-rose-500/20 hover:border-rose-500/40 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow active:scale-[0.98]"
                >
                  Đóng hội thoại
                </button>
              ) : (
                <button
                  onClick={handleOpenTicket}
                  className="px-4 py-1.5 text-emerald-400 hover:text-white hover:bg-emerald-600/10 border border-emerald-500/20 hover:border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow active:scale-[0.98]"
                >
                  Mở lại hội thoại
                </button>
              )}
            </div>

            {/* Chat Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#120F0E]/30 scrollbar-thin select-text">
              
              {/* Client mini contact profiles */}
              <div className="max-w-md mx-auto bg-[#1C1816]/40 border border-white/[0.04] p-4 rounded-2xl flex flex-col gap-2 shadow select-none animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <User className="w-3.5 h-3.5 text-[#c9a15c]" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#c9a15c]">Hồ sơ khách hàng</span>
                </div>
                <div className="text-[10px] space-y-1.5 text-gray-300 font-semibold">
                  <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-500" /> <span className="select-all">{activeConv.customerId.email}</span></div>
                  {activeConv.customerId.phone && (
                    <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-500" /> <span className="select-all">{activeConv.customerId.phone}</span></div>
                  )}
                </div>
              </div>

              {/* Loader during message fetches */}
              {loadingChat ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#c9a15c] animate-spin" />
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isAdmin = msg.senderRole === "ADMIN";
                  
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex w-full ${isAdmin ? "justify-end animate-in slide-in-from-right-4" : "justify-start animate-in slide-in-from-left-4"} duration-300`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        isAdmin 
                          ? "bg-[#c9a15c]/10 text-white border border-[#c9a15c]/25 rounded-tr-none shadow shadow-[#c9a15c]/5" 
                          : "bg-[#1C1816]/70 text-gray-100 border border-white/[0.04] rounded-tl-none shadow"
                      }`}>
                        <p>{msg.content}</p>
                        
                        {/* Status timeline & tick receipts */}
                        <div className={`flex items-center gap-1 mt-1.5 text-[8px] font-bold tracking-wide uppercase select-none ${
                          isAdmin ? "justify-end text-gray-400" : "justify-start text-gray-500"
                        }`}>
                          <span>{formatChatTime(msg.createdAt)}</span>
                          {isAdmin && (
                            msg.isRead ? <CheckCheck className="w-3 h-3 text-[#c9a15c]" /> : <Check className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Support Message Send Input Bar */}
            {activeConv.status === "OPEN" ? (
              <form 
                onSubmit={handleSendMessage}
                className="h-20 bg-[#1C1816]/50 border-t border-white/[0.06] p-4 flex gap-3 items-center shrink-0"
              >
                <input
                  type="text"
                  placeholder="Nhập nội dung tin nhắn hỗ trợ khách hàng..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 h-full px-4 bg-[#14110F] border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="w-12 h-full bg-[#c9a15c] hover:bg-[#b88f4b] disabled:bg-gray-800 disabled:text-gray-600 text-[#14110F] rounded-xl flex items-center justify-center transition-all cursor-pointer shadow active:scale-[0.96]"
                >
                  <Send className="w-4 h-4 shrink-0" />
                </button>
              </form>
            ) : (
              <div className="h-16 bg-[#1A1311] px-6 border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-xs text-rose-400 font-bold uppercase tracking-wider shrink-0 select-none">
                <XCircle className="w-4 h-4" /> Cuộc hội thoại đã đóng. Bạn không thể gửi phản hồi.
              </div>
            )}
          </>
        ) : (
          /* SUPPORT CONSOLE EMPTY STANDBY CARD */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 select-none">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center shadow-lg shadow-black/40">
              <MessageSquare className="w-8 h-8 text-[#c9a15c] stroke-[1.5]" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-serif text-sm font-bold text-white tracking-widest uppercase">Trung tâm hỗ trợ</h4>
              <p className="text-xs text-gray-500 leading-relaxed italic">
                "Chọn một phiên hỗ trợ bên trái hoặc tải lại danh sách để bắt đầu hội thoại Live Chat Socket.IO thời gian thực."
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
