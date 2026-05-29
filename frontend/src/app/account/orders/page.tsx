"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";
import { ShoppingBag, Calendar, CreditCard, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { OrderDetailModal, OrderData } from "./components/OrderDetailModal";
import { CancelOrderModal } from "./components/CancelOrderModal";
import { ReviewModal } from "./components/ReviewModal";

export default function OrderHistoryPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-[#eef2f6] font-sans">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-32 max-w-4xl">
          <OrderHistoryContent />
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}

function OrderHistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Nhận trạng thái lọc từ Query parameters URL (Ví dụ: ?status=pending)
  const currentTab = searchParams.get("status") || "all";

  // Trạng thái dữ liệu chính
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Trạng thái điều hướng Modals
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  
  // Trạng thái cho Review Modal
  const [reviewOrder, setReviewOrder] = useState<{orderId: string, productId: string, productName: string} | null>(null);

  // Nạp danh sách đơn hàng từ API
  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/orders/my`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOrders(data.data || []);
      } else {
        setError(data.message || "Không thể tải lịch sử đơn hàng của bạn.");
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền internet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Lọc danh sách đơn hàng theo Tab được chọn
  const filteredOrders = orders.filter((order) => {
    if (currentTab === "all") return true;
    return order.orderStatus.toLowerCase() === currentTab.toLowerCase();
  });

  // Xử lý Thay đổi Tab bộ lọc
  const handleTabChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", status);
    router.push(`/account/orders?${params.toString()}`);
  };

  // Đồng bộ cập nhật lại chi tiết đơn hàng sau khi có thay đổi (chuyển khoản hoặc hủy đơn)
  const handleSyncOrderDetail = async () => {
    await fetchOrders();
    if (selectedOrder) {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/orders/my`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const latest = (data.data || []).find((o: OrderData) => o._id === selectedOrder._id);
        if (latest) {
          setSelectedOrder(latest);
        }
      }
    }
  };

  // Helper Định dạng ngày tháng thanh lịch Việt Nam
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Helper Định dạng giá tiền tệ VNĐ sang trọng
  const formatPrice = (amount: number) => {
    return amount.toLocaleString("vi-VN") + " VNĐ";
  };

  // Badge Trạng thái
  const getStatusBadge = (status: OrderData["orderStatus"]) => {
    const configs = {
      PENDING: {
        bg: "bg-amber-50 border-amber-200 text-amber-700",
        label: "Đang chờ duyệt",
      },
      CONFIRMED: {
        bg: "bg-blue-50 border-blue-200 text-blue-700",
        label: "Đã xác nhận",
      },
      SHIPPING: {
        bg: "bg-orange-50 border-orange-200 text-orange-700",
        label: "Đang giao hàng",
      },
      DELIVERED: {
        bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
        label: "Giao thành công",
      },
      CANCELLED: {
        bg: "bg-rose-50 border-rose-200 text-rose-700",
        label: "Đã hủy đơn",
      },
    };
    const conf = configs[status] || { bg: "bg-gray-100 border-gray-300 text-gray-700", label: status };
    return (
      <span className={`text-[10px] md:text-xs font-semibold px-3 py-1 rounded-full border ${conf.bg} uppercase tracking-wider`}>
        {conf.label}
      </span>
    );
  };

  // Danh mục Các trạng thái Lọc (Tabs)
  const TABS = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Đang chờ" },
    { value: "confirmed", label: "Xác nhận" },
    { value: "shipping", label: "Đang giao" },
    { value: "delivered", label: "Đã giao" },
    { value: "cancelled", label: "Đã Hủy" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Tiêu đề Trang */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-serif tracking-wide text-[#2b2b2b] font-semibold">
          LỊCH SỬ ĐƠN HÀNG
        </h1>
        <p className="text-xs text-secondary-foreground mt-2 uppercase tracking-[0.2em] font-medium">
          Theo dõi trạng thái & Chi tiết mua sắm của bạn
        </p>
      </div>

      {/* 1. MẠNG TAB ĐIỀU HƯỚNG BỘ LỌC */}
      <div className="border-b border-[#e2e8f0] overflow-x-auto scrollbar-none flex gap-6 md:gap-8 -mx-4 px-4 md:mx-0 md:px-0">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`py-3 text-xs md:text-sm font-semibold tracking-wider transition-all relative shrink-0 cursor-pointer ${
              currentTab === tab.value 
                ? "text-[#2e4c7e] font-bold" 
                : "text-gray-400 hover:text-[#2b2b2b]"
            }`}
          >
            {tab.label}
            {currentTab === tab.value && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2e4c7e] rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300" />
            )}
          </button>
        ))}
      </div>

      {/* 2. LOADING STATE */}
      {loading && (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="flex justify-between items-center border-b border-[#FAF8F6] pb-4">
                <div className="h-5 w-32 bg-gray-100 rounded-lg" />
                <div className="h-6 w-24 bg-gray-100 rounded-full" />
              </div>
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-2/3 bg-gray-100 rounded" />
                  <div className="h-3 w-1/4 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-[#FAF8F6] pt-4">
                <div className="h-4 w-20 bg-gray-100 rounded" />
                <div className="h-5 w-28 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="bg-white border border-red-100 rounded-2xl p-8 text-center max-w-md mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 stroke-[1.5]" />
          <h3 className="text-sm font-semibold text-gray-800">Không thể lấy dữ liệu</h3>
          <p className="text-xs text-red-600 mt-2 leading-relaxed">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-5 px-6 py-2 bg-[#eef2f6] border border-[#2e4c7e] text-[#2e4c7e] hover:bg-[#2e4c7e] hover:text-white text-xs font-semibold rounded-full transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tải lại trang
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-12 text-center shadow-[0_15px_40px_-20px_rgba(201,161,92,0.12)]">
          <div className="w-16 h-16 rounded-full bg-[#eef2f6] border border-[#e2e8f0]/50 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-6 h-6 text-[#2e4c7e] stroke-[1.5]" />
          </div>
          <h3 className="text-base font-serif font-semibold text-[#2b2b2b]">
            Quý khách chưa có đơn hàng nào
          </h3>
          <p className="text-xs text-[#777] max-w-sm mx-auto leading-relaxed mt-2.5">
            Lớp vỏ trai óng ánh lấp lánh đang chờ đợi được chế tác. Quý khách hãy khám phá các bộ sưu tập phụ kiện và trang sức khảm xà cừ thượng lưu của chúng tôi.
          </p>
          <div className="mt-8">
            <Link
              href="/san-pham"
              className="px-8 py-3.5 bg-[#2e4c7e] hover:bg-[#c49490] text-white text-xs font-semibold rounded-full tracking-wider transition-all inline-block shadow-md shadow-[#2e4c7e]/15 cursor-pointer"
            >
              Khám phá sản phẩm ngay
            </Link>
          </div>
        </div>
      )}

      {/* DATA STATE */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white border border-[#e2e8f0] rounded-2xl shadow-[0_15px_45px_-20px_rgba(201,161,92,0.08)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_-15px_rgba(201,161,92,0.12)] animate-in fade-in slide-in-from-bottom-2 duration-400"
            >
              {/* Tiêu đề Đơn */}
              <div 
                onClick={() => setSelectedOrder(order)}
                className="bg-[#FAF8F6] border-b border-[#F1EEE8] px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#777] uppercase tracking-widest leading-none">Mã đơn hàng</span>
                    <span className="text-sm font-bold text-[#2b2b2b] tracking-wider leading-none group-hover:text-[#2e4c7e] transition-colors">
                      {order.orderCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#777]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Đặt ngày: {formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <div>
                  {getStatusBadge(order.orderStatus)}
                </div>
              </div>

              {/* Danh sách Sản phẩm Snapshot con */}
              <div className="divide-y divide-[#F1EEE8] px-6">
                {order.items.map((item, index) => (
                  <div key={index} className="py-4.5 flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-xl border border-gray-150 overflow-hidden bg-gray-50 shrink-0 shadow-inner">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                          No Pic
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#2b2b2b] truncate hover:text-[#2e4c7e] transition-colors">
                        {item.name}
                      </h4>
                      <div className="flex justify-between items-center mt-1 text-xs text-[#777]">
                        <span>Số lượng: <span className="font-bold text-[#2b2b2b]">{item.quantity}</span></span>
                        <span className="font-medium text-[#2b2b2b]">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                    
                    {order.orderStatus === 'DELIVERED' && (
                      <div className="shrink-0 ml-4">
                        {!item.isReviewed ? (
                          <button
                            onClick={() => {
                              const prodId = typeof item.productId === 'string' ? item.productId : item.productId?._id;
                              if (prodId) {
                                setReviewOrder({
                                  orderId: order._id,
                                  productId: prodId,
                                  productName: item.name
                                });
                              }
                            }}
                            className="px-4 py-2 border border-[#2e4c7e] text-[#2e4c7e] hover:bg-[#2e4c7e] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Viết đánh giá
                          </button>
                        ) : (
                          <span className="px-4 py-2 text-[#777] text-xs font-semibold bg-gray-100 rounded-lg">
                            Đã đánh giá
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Hàng tổng quan thanh toán & Nút hành động */}
              <div className="bg-[#FAF8F6]/30 border-t border-[#F1EEE8] px-6 py-4.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-[#777]">
                  <CreditCard className="w-4 h-4 text-[#2e4c7e]" />
                  <span>Hình thức: <span className="font-semibold text-[#2b2b2b]">{order.paymentMethod === "QR" ? "Chuyển khoản QR" : "Thanh toán COD"}</span></span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-[#777]">Tổng cộng thanh toán:</span>
                    <p className="text-base font-serif font-extrabold text-[#2e4c7e] tracking-wider mt-0.5">
                      {formatPrice(order.totalAmount)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-5 py-2.5 bg-[#eef2f6] border border-[#2e4c7e] hover:bg-[#2e4c7e] hover:text-white text-[#2e4c7e] text-xs font-semibold rounded-full transition-all cursor-pointer shadow-sm active:scale-[0.98] flex items-center gap-1"
                    >
                      Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Chỉ được hủy đơn khi ở trạng thái PENDING */}
                    {order.orderStatus === "PENDING" && (
                      <button
                        onClick={() => setCancellingOrderId(order._id)}
                        className="px-5 py-2.5 bg-white border border-[#e2e8f0] hover:border-red-400 hover:text-red-500 text-[#777] text-xs font-semibold rounded-full transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 3. MODAL HỦY ĐƠN HÀNG */}
      <CancelOrderModal 
        orderId={cancellingOrderId}
        onClose={() => setCancellingOrderId(null)}
        onCancelSuccess={async () => {
          await fetchOrders();
          setSelectedOrder(null); // Đóng luôn chi tiết đơn hàng
        }}
      />

      {/* MODAL ĐÁNH GIÁ */}
      {reviewOrder && (
        <ReviewModal
          orderId={reviewOrder.orderId}
          productId={reviewOrder.productId}
          productName={reviewOrder.productName}
          onClose={() => setReviewOrder(null)}
          onSuccess={async () => {
            setReviewOrder(null);
            await fetchOrders();
          }}
        />
      )}

      {/* 4. MODAL CHI TIẾT ĐƠN HÀNG */}
      <OrderDetailModal 
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onCancelTrigger={(orderId) => setCancellingOrderId(orderId)}
        onNotifySuccess={handleSyncOrderDetail}
        getStatusBadge={getStatusBadge}
        formatDate={formatDate}
        formatPrice={formatPrice}
      />

    </div>
  );
}

