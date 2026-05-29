"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import { 
  Search, Eye, Clock, X, Check, Truck, CheckCircle2, AlertTriangle, 
  RotateCw, Loader2, Calendar, User, Phone, MapPin, CreditCard, ChevronRight, XCircle, 
  Clipboard, Copy, ShoppingBag
} from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import { useConfirm } from "@/components/ui/ConfirmContext";

interface TimelineItem {
  status: string;
  time: string;
  note: string;
  _id?: string;
}

interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface OrderData {
  _id: string;
  orderCode: string;
  userId?: string;
  customerName: string;
  phone: string;
  shippingAddress: string;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  orderStatus: "PENDING" | "CONFIRMED" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  cancelReason?: string;
  timeline?: TimelineItem[];
  createdAt: string;
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] w-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#c9a15c] animate-spin" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Load auto-detail if routed from dashboard
  const codeParam = searchParams.get("code") || "";

  // State Management
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("-createdAt");

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState("Khách hàng yêu cầu hủy");
  const [cancelReasonCustom, setCancelReasonCustom] = useState("");
  
  const toast = useToast();
  const { confirm } = useConfirm();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/orders`);
      const data = await res.json();

      if (res.ok && data.success) {
        setOrders(data.data || []);
      } else {
        setError(data.message || "Không thể tải danh sách đơn hàng.");
      }
    } catch (err) {
      setError("Lỗi kết nối máy chủ quản lý đơn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Trigger modal auto-open if codeParam exists in search params
  useEffect(() => {
    if (codeParam && orders.length > 0) {
      const matched = orders.find(o => o.orderCode === codeParam);
      if (matched) {
        setSelectedOrder(matched);
      }
    }
  }, [codeParam, orders]);

  // Filters & Search computations
  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === "ALL" || o.orderStatus === statusFilter;
    const matchesSearch = 
      o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      (o.userId && typeof o.userId === "string" && o.userId.includes(search));
    return matchesStatus && matchesSearch;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === "-createdAt") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "createdAt") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "-totalAmount") {
      return b.totalAmount - a.totalAmount;
    }
    return a.totalAmount - b.totalAmount;
  });

  // State Transition calls
  const handleTransition = async (orderId: string, action: "confirm" | "ship" | "deliver" | "confirm-payment") => {
    setActionLoading(orderId + "-" + action);
    try {
      const endpoint = `${API_BASE_URL}/api/orders/${orderId}/${action}`;
      const res = await fetchWithAuth(endpoint, { method: "PUT" });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Cập nhật trạng thái thành công`);
        // Sync orders
        await fetchOrders();
        // Update selected modal view if currently open
        if (selectedOrder && selectedOrder._id === orderId) {
          const updated = orders.find(o => o._id === orderId);
          if (updated) setSelectedOrder(data.data);
        }
      } else {
        toast.error(data.message || `Lỗi cập nhật trạng thái đơn hàng.`);
      }
    } catch (err) {
      toast.error("Lỗi kết nối máy chủ cập nhật.");
    } finally {
      setActionLoading(null);
    }
  };

  // Cancellation calls
  const triggerCancelModal = (orderId: string) => {
    setCancellingOrderId(orderId);
    setIsCancelModalOpen(true);
    setCancelReasonCustom("");
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrderId) return;

    const reason = cancelReasonPreset === "Lý do khác" ? cancelReasonCustom.trim() : cancelReasonPreset;
    if (cancelReasonPreset === "Lý do khác" && !reason) {
      toast.error("Vui lòng nhập lý do cụ thể.");
      return;
    }

    setActionLoading(cancellingOrderId + "-cancel");
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/orders/${cancellingOrderId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Hủy đơn hàng thành công");
        setIsCancelModalOpen(false);
        setCancellingOrderId(null);
        await fetchOrders();
        if (selectedOrder && selectedOrder._id === cancellingOrderId) {
          setSelectedOrder(data.data);
        }
      } else {
        toast.error(data.message || "Lỗi hủy đơn hàng.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối máy chủ hủy đơn.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " - " + d.toLocaleDateString("vi-VN");
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Status Badges
  const getStatusBadge = (status: OrderData["orderStatus"]) => {
    const mapping: Record<OrderData["orderStatus"], { label: string; style: string }> = {
      PENDING: { label: "Chờ duyệt", style: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
      CONFIRMED: { label: "Đã xác nhận", style: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
      SHIPPING: { label: "Đang giao", style: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
      DELIVERED: { label: "Đã giao", style: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
      CANCELLED: { label: "Đã hủy", style: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
    };
    const mapped = mapping[status] || { label: status, style: "bg-gray-500/10 text-gray-400 border border-gray-500/20" };
    return (
      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${mapped.style}`}>
        {mapped.label}
      </span>
    );
  };

  const getPaymentBadge = (status: OrderData["paymentStatus"]) => {
    const mapping: Record<OrderData["paymentStatus"], { label: string; style: string }> = {
      PENDING: { label: "Chưa thanh toán", style: "bg-amber-500/15 text-amber-400 border border-amber-500/20" },
      PAID: { label: "Đã thanh toán", style: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" },
      FAILED: { label: "Thanh toán lỗi", style: "bg-rose-500/15 text-rose-400 border border-rose-500/20" },
      REFUNDED: { label: "Đã hoàn tiền", style: "bg-gray-500/15 text-gray-400 border border-gray-500/20" }
    };
    const mapped = mapping[status] || { label: status, style: "bg-gray-500/15 text-gray-400 border border-gray-500/20" };
    return (
      <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${mapped.style}`}>
        {mapped.label}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-white font-semibold">
            QUẢN LÝ ĐƠN HÀNG
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-[0.2em] font-medium">
            Kiểm tra trạng thái giỏ hàng & Quy trình vận đơn
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-[#c9a15c] border border-white/[0.08] hover:border-[#c9a15c] text-gray-300 hover:text-[#14110F] text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
        >
          <RotateCw className="w-3.5 h-3.5" /> Đồng bộ đơn hàng
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl backdrop-blur-md">
        {/* Search Field */}
        <div className="relative md:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo mã đơn, họ tên, số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
          />
        </div>

        {/* Sort selector */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#1C1816] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all cursor-pointer font-semibold"
          >
            <option value="-createdAt">Đơn mới nhất trước</option>
            <option value="createdAt">Đơn cũ nhất trước</option>
            <option value="-totalAmount">Giá trị đơn giảm dần</option>
            <option value="totalAmount">Giá trị đơn tăng dần</option>
          </select>
        </div>

        {/* Quick counts */}
        <div className="flex items-center justify-end pr-2 text-xs font-semibold text-gray-400">
          Kết quả lọc: <span className="font-extrabold text-[#c9a15c] ml-1">{sortedOrders.length} đơn</span>
        </div>
      </div>

      {/* TABS FILTER */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin select-none">
        {["ALL", "PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"].map((status) => {
          const isActive = statusFilter === status;
          const count = orders.filter(o => status === "ALL" || o.orderStatus === status).length;
          const labelMap: Record<string, string> = {
            ALL: "Tất cả",
            PENDING: "Chờ duyệt",
            CONFIRMED: "Đã xác nhận",
            SHIPPING: "Đang giao",
            DELIVERED: "Đã giao",
            CANCELLED: "Đã hủy",
          };

          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                isActive 
                  ? "bg-[#c9a15c] text-[#14110F] border-[#c9a15c] shadow-lg shadow-[#c9a15c]/10 scale-[1.03]" 
                  : "bg-[#1C1816] text-gray-400 hover:text-white border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              {labelMap[status]}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                isActive ? "bg-[#14110F]/20 text-[#14110F]" : "bg-white/5 text-gray-500"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ORDERS DATATABLE */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C1816] text-[#c9a15c] uppercase font-bold tracking-widest text-[9px] border-b border-white/[0.06]">
                <th className="px-5 py-4">Mã Đơn</th>
                <th className="px-5 py-4">Khách Hàng</th>
                <th className="px-5 py-4">Liên Hệ</th>
                <th className="px-5 py-4">Tổng Tiền</th>
                <th className="px-5 py-4">Trạng Thái Đơn</th>
                <th className="px-5 py-4">Trạng Thái Thanh Toán</th>
                <th className="px-5 py-4">Quy Trình Xử Lý</th>
                <th className="px-5 py-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] bg-[#161311]/40">
              {sortedOrders.length > 0 ? (
                sortedOrders.map((ord) => {
                  const isTransitioning = (action: string) => actionLoading === ord._id + "-" + action;

                  return (
                    <tr key={ord._id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-white select-all">{ord.orderCode}</td>
                      <td className="px-5 py-4 font-semibold text-white">{ord.customerName}</td>
                      <td className="px-5 py-4 text-gray-400 font-medium space-y-1">
                        <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {ord.phone}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#c9a15c]">{formatPrice(ord.totalAmount)}</td>
                      <td className="px-5 py-4">{getStatusBadge(ord.orderStatus)}</td>
                      <td className="px-5 py-4">{getPaymentBadge(ord.paymentStatus)}</td>
                      
                      {/* Lifecycle action triggers */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          
                          {/* 1. Confirm Payment for QR Pending orders */}
                          {ord.paymentMethod === "QR" && ord.paymentStatus === "PENDING" && (
                            <button
                              onClick={() => handleTransition(ord._id, "confirm-payment")}
                              disabled={!!actionLoading}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-white font-bold rounded-lg uppercase tracking-wider text-[9px] transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-600/10 active:scale-[0.98]"
                            >
                              {isTransitioning("confirm-payment") ? <Loader2 className="w-3 h-3 animate-spin" /> : "Xác nhận tiền"}
                            </button>
                          )}

                          {/* 2. PENDING lifecycle */}
                          {ord.orderStatus === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleTransition(ord._id, "confirm")}
                                disabled={!!actionLoading}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-bold rounded-lg uppercase tracking-wider text-[9px] transition-all flex items-center gap-1 cursor-pointer shadow-md active:scale-[0.98]"
                              >
                                {isTransitioning("confirm") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Duyệt đơn
                              </button>
                              <button
                                onClick={() => triggerCancelModal(ord._id)}
                                disabled={!!actionLoading}
                                className="px-3 py-1 bg-rose-950/40 hover:bg-rose-900/30 text-rose-400 border border-rose-500/20 font-bold rounded-lg uppercase tracking-wider text-[9px] transition-all flex items-center gap-1 cursor-pointer"
                              >
                                Hủy đơn
                              </button>
                            </>
                          )}

                          {/* 3. CONFIRMED lifecycle */}
                          {ord.orderStatus === "CONFIRMED" && (
                            <>
                              <button
                                onClick={() => handleTransition(ord._id, "ship")}
                                disabled={!!actionLoading}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-bold rounded-lg uppercase tracking-wider text-[9px] transition-all flex items-center gap-1 cursor-pointer shadow-md active:scale-[0.98]"
                              >
                                {isTransitioning("ship") ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck className="w-3 h-3" />} Giao hàng
                              </button>
                              <button
                                onClick={() => triggerCancelModal(ord._id)}
                                disabled={!!actionLoading}
                                className="px-3 py-1 bg-rose-950/40 hover:bg-rose-900/30 text-rose-400 border border-rose-500/20 font-bold rounded-lg uppercase tracking-wider text-[9px] transition-all flex items-center gap-1 cursor-pointer"
                              >
                                Hủy đơn
                              </button>
                            </>
                          )}

                          {/* 4. SHIPPING lifecycle */}
                          {ord.orderStatus === "SHIPPING" && (
                            <>
                              <button
                                onClick={() => handleTransition(ord._id, "deliver")}
                                disabled={!!actionLoading}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-white font-bold rounded-lg uppercase tracking-wider text-[9px] transition-all flex items-center gap-1 cursor-pointer shadow-md active:scale-[0.98]"
                              >
                                {isTransitioning("deliver") ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Hoàn thành
                              </button>
                              
                              {/* SHIPPING CANCELLATION IS LOCKED! CANNOT CANCEL */}
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black select-none border border-white/5 px-2.5 py-1 rounded-lg">Không thể hủy</span>
                            </>
                          )}

                          {/* 5. DELIVERED & CANCELLED terminal states */}
                          {ord.orderStatus === "DELIVERED" && (
                            <span className="text-[9px] text-emerald-400 font-extrabold tracking-wider border border-emerald-500/10 px-2 py-0.5 bg-emerald-500/5 rounded">Hoàn tất kiểm kê</span>
                          )}

                          {ord.orderStatus === "CANCELLED" && (
                            <span className="text-[9px] text-rose-400 font-extrabold tracking-wider border border-rose-500/10 px-2 py-0.5 bg-rose-500/5 rounded">Đã hủy đơn</span>
                          )}

                        </div>
                      </td>

                      {/* Detail slide viewer */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-500 italic">
                    Chưa có đơn hàng nào khớp với điều kiện lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER SLIDER MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-[#1C1816] border border-white/[0.08] rounded-2xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#171412] px-6 py-4.5 border-b border-white/[0.06] flex justify-between items-center shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Mã đơn hàng</span>
                  <span className="text-base font-bold text-[#c9a15c] tracking-wider leading-none select-all">{selectedOrder.orderCode}</span>
                </div>
                <p className="text-[10px] text-gray-400">Thời gian tạo: {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedOrder.orderStatus)}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable Layout) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin">
              
              {/* Double pane info */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
                
                {/* Left Pane (3/5 columns): Snapshot products & Timeline history */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Products card snapshot */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                      <ShoppingBag className="w-4 h-4 text-[#c9a15c]" /> Sản phẩm đã chọn
                    </h4>
                    <div className="divide-y divide-white/[0.06] bg-[#161311]/20 border border-white/[0.06] rounded-xl overflow-hidden shadow-inner">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="p-4 flex gap-4 items-center">
                          <div className="w-14 h-14 rounded-lg border border-white/5 overflow-hidden shrink-0 bg-[#1C1816] shadow">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/5 text-[9px] text-gray-500 font-bold uppercase">No Pic</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-semibold text-white truncate">{item.name}</h5>
                            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1 font-semibold">
                              <span>Số lượng: <span className="text-white">{item.quantity}</span></span>
                              <span className="text-[#c9a15c]">{formatPrice(item.price)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vertical Timeline Audit log history */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                      <Clock className="w-4 h-4 text-[#c9a15c]" /> Nhật ký hành trình đơn & Kiểm toán (Audit Logs)
                    </h4>
                    <div className="bg-[#161311]/20 border border-white/[0.06] rounded-xl p-5 shadow-inner">
                      <div className="relative pl-6 border-l border-white/[0.06] space-y-6">
                        {(selectedOrder.timeline ? [...selectedOrder.timeline].sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()) : []).map((t, idx) => {
                          const isLatest = idx === 0;

                          const getTimelineLabel = (statusStr: string) => {
                            const mapping: Record<string, string> = {
                              PENDING: "Đặt hàng thành công",
                              CONFIRMED: "Đã xác nhận đơn hàng",
                              SHIPPING: "Đang giao cho đơn vị vận chuyển",
                              DELIVERED: "Giao hàng thành công",
                              CANCELLED: "Đã hủy đơn hàng",
                              PAYMENT_NOTIFIED: "Khách hàng báo chuyển khoản",
                              PAID: "Đã thanh toán thành công"
                            };
                            return mapping[statusStr] || statusStr;
                          };

                          return (
                            <div key={t._id || idx} className="relative">
                              <span className={`absolute -left-[30px] top-1.5 w-2.5 h-2.5 rounded-full flex items-center justify-center border transition-all ${
                                isLatest ? "bg-[#c9a15c] border-[#c9a15c]" : "bg-[#1C1816] border-gray-600"
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${isLatest ? "bg-[#14110F] animate-pulse" : "bg-gray-600"}`} />
                              </span>
                              
                              <div className="space-y-1">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                                  <span className={`text-xs font-bold ${isLatest ? "text-[#c9a15c]" : "text-gray-400"}`}>
                                    {getTimelineLabel(t.status)}
                                  </span>
                                  <span className="text-[9px] text-gray-500 font-semibold">{formatDate(t.time)}</span>
                                </div>
                                {t.note && (
                                  <p className="text-[10px] text-gray-400 bg-white/[0.01] rounded-lg p-2 border border-white/[0.04] leading-relaxed italic">
                                    &ldquo;{t.note}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Pane (2/5 columns): Shipping info, Billing totals, Transfer details */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Shipping address cards */}
                  <div className="bg-[#171412] border border-white/[0.06] rounded-xl p-5 space-y-3.5 shadow">
                    <h4 className="text-xs font-bold text-[#c9a15c] uppercase tracking-wider border-b border-white/5 pb-2">
                      Thông tin nhận hàng
                    </h4>
                    <div className="text-[11px] space-y-3 text-gray-300 font-semibold">
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase tracking-wider font-bold">Người nhận:</span>
                        <span className="text-white text-xs">{selectedOrder.customerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase tracking-wider font-bold">Số điện thoại:</span>
                        <span className="text-white">{selectedOrder.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase tracking-wider font-bold">Địa chỉ nhận hàng:</span>
                        <p className="text-white font-medium mt-0.5 leading-relaxed">{selectedOrder.shippingAddress}</p>
                      </div>
                      {selectedOrder.note && (
                        <div>
                          <span className="text-gray-500 block text-[9px] uppercase tracking-wider font-bold">Ghi chú của khách:</span>
                          <p className="italic text-gray-400 bg-white/[0.01] border border-white/[0.04] p-2.5 rounded-lg mt-1 font-normal leading-relaxed">
                            &ldquo;{selectedOrder.note}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment scan cards (If QR payment, pending confirmation) */}
                  {selectedOrder.paymentMethod === "QR" && selectedOrder.paymentStatus === "PENDING" && (
                    <div className="bg-white/[0.02] border border-[#c9a15c]/25 rounded-xl p-5 space-y-4 shadow-xl">
                      <div className="text-center space-y-1">
                        <h4 className="text-xs font-bold text-[#c9a15c] uppercase tracking-wider">Mã QR chuyển khoản của đơn</h4>
                        <p className="text-[9px] text-gray-400">MB Bank - 0965491328 - KHẨM HOA STORE</p>
                      </div>
                      <div className="w-36 h-36 bg-white rounded-lg overflow-hidden mx-auto p-1.5 flex items-center justify-center">
                        <img 
                          src={`https://img.vietqr.io/image/MB-0965491328-compact2.png?amount=${selectedOrder.totalAmount}&addInfo=KhamHoa%20${selectedOrder.orderCode}`} 
                          alt="VietQR code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-[10px] space-y-1.5 border-t border-white/5 pt-3 font-semibold text-gray-300">
                        <div className="flex justify-between"><span>Số tiền:</span><span className="text-white font-bold">{formatPrice(selectedOrder.totalAmount)}</span></div>
                        <div className="flex justify-between"><span>Nội dung:</span><span className="font-mono text-white select-all">KhamHoa {selectedOrder.orderCode}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Billing Details receipt totals */}
                  <div className="bg-[#171412] border border-white/[0.06] rounded-xl p-5 space-y-3.5 shadow">
                    <h4 className="text-xs font-bold text-[#c9a15c] uppercase tracking-wider border-b border-white/5 pb-2">
                      Chi tiết thanh toán
                    </h4>
                    <div className="text-[11px] space-y-2.5 text-gray-300 font-semibold">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tạm tính sản phẩm:</span>
                        <span>{formatPrice(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phí vận chuyển:</span>
                        <span>{formatPrice(selectedOrder.shippingFee || 30000)}</span>
                      </div>
                      {selectedOrder.discountAmount > 0 && (
                        <div className="flex justify-between text-rose-400 font-bold bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                          <span>Giảm giá Voucher:</span>
                          <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t border-white/[0.06]">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Tổng thanh toán:</span>
                        <span className="text-sm font-serif font-black text-[#c9a15c] tracking-wide">
                          {formatPrice(selectedOrder.totalAmount)}
                        </span>
                      </div>
                      <div className="pt-2 flex justify-between text-[10px]">
                        <span className="text-gray-500">Hình thức:</span>
                        <span className="text-white font-bold">{selectedOrder.paymentMethod === "QR" ? "Chuyển khoản VietQR" : "Thanh toán COD"}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500">Thanh toán:</span>
                        {getPaymentBadge(selectedOrder.paymentStatus)}
                      </div>
                    </div>
                  </div>

                  {/* Cancel reason if cancelled */}
                  {selectedOrder.orderStatus === "CANCELLED" && selectedOrder.cancelReason && (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 space-y-1">
                      <span className="text-[9px] uppercase tracking-wider text-rose-400 font-black">Lý do hủy đơn hàng:</span>
                      <p className="text-xs text-rose-300 font-semibold italic">&ldquo;{selectedOrder.cancelReason}&rdquo;</p>
                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* Modal Footer (Workflow operations) */}
            <div className="bg-[#171412] px-6 py-4.5 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <div className="text-[10px] text-gray-500 font-semibold">
                Kiểm duyệt quy trình vận đơn an toàn, chuyên nghiệp
              </div>
              <div className="flex gap-3 w-full sm:w-auto justify-end">
                
                {/* 1. Confirm QR Payment inside modal details view */}
                {selectedOrder.paymentMethod === "QR" && selectedOrder.paymentStatus === "PENDING" && (
                  <button
                    onClick={() => handleTransition(selectedOrder._id, "confirm-payment")}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    Duyệt thanh toán
                  </button>
                )}

                {/* 2. PENDING actions */}
                {selectedOrder.orderStatus === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleTransition(selectedOrder._id, "confirm")}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full uppercase tracking-wider transition-all shadow-md cursor-pointer"
                    >
                      Duyệt đơn hàng
                    </button>
                    <button
                      onClick={() => triggerCancelModal(selectedOrder._id)}
                      className="px-5 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-full uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Hủy đơn hàng
                    </button>
                  </>
                )}

                {/* 3. CONFIRMED actions */}
                {selectedOrder.orderStatus === "CONFIRMED" && (
                  <>
                    <button
                      onClick={() => handleTransition(selectedOrder._id, "ship")}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-full uppercase tracking-wider transition-all shadow-md cursor-pointer"
                    >
                      Giao cho hãng vận chuyển
                    </button>
                    <button
                      onClick={() => triggerCancelModal(selectedOrder._id)}
                      className="px-5 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-full uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Hủy đơn hàng
                    </button>
                  </>
                )}

                {/* 4. SHIPPING actions */}
                {selectedOrder.orderStatus === "SHIPPING" && (
                  <button
                    onClick={() => handleTransition(selectedOrder._id, "deliver")}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-full uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    Xác nhận giao thành công
                  </button>
                )}

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-full tracking-wider transition-all cursor-pointer border border-white/10"
                >
                  Đóng chi tiết
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CANCELLATION MODAL POPUP */}
      {isCancelModalOpen && cancellingOrderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1C1816] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-white/[0.06] mb-4">
              <h3 className="text-base font-serif font-bold text-white tracking-wide">Lý do hủy đơn hàng</h3>
              <button 
                onClick={() => setIsCancelModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              {/* Preset reason dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chọn lý do hủy</label>
                <select
                  value={cancelReasonPreset}
                  onChange={(e) => setCancelReasonPreset(e.target.value)}
                  className="w-full px-3 py-2 bg-[#14110F] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all cursor-pointer font-semibold"
                >
                  <option value="Khách yêu cầu hủy">Khách yêu cầu hủy</option>
                  <option value="Hết hàng / Hết tồn kho">Hết hàng / Hết tồn kho</option>
                  <option value="Không liên hệ được với người nhận">Không liên hệ được với người nhận</option>
                  <option value="Sai lệch thông tin sản phẩm / Giá cả">Sai lệch thông tin sản phẩm / Giá cả</option>
                  <option value="Lý do khác">Lý do khác...</option>
                </select>
              </div>

              {/* Custom custom reason textarea */}
              {cancelReasonPreset === "Lý do khác" && (
                <div className="space-y-1.5 animate-in fade-in duration-300">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mô tả lý do hủy cụ thể</label>
                  <textarea
                    placeholder="Quý khách vui lòng điền cụ thể..."
                    required
                    value={cancelReasonCustom}
                    onChange={(e) => setCancelReasonCustom(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 bg-transparent border border-white/[0.08] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all resize-none"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-full cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === cancellingOrderId + "-cancel"}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-full tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/10 active:scale-[0.98]"
                >
                  {actionLoading === cancellingOrderId + "-cancel" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xác nhận hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
