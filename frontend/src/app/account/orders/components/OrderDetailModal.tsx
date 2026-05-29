"use client";

import React, { useState } from "react";
import { 
  ShoppingBag, Clock, X, Copy, Loader2, XCircle, 
  Calendar, CreditCard 
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";

export interface TimelineItem {
  status: string;
  time: string;
  note: string;
  _id?: string;
}

export interface OrderItem {
  productId: {
    _id: string;
    name: string;
    image: string;
    price: number;
    slug?: string;
  } | null;
  name: string;
  image: string;
  price: number;
  quantity: number;
  subtotal: number;
  isReviewed?: boolean;
}

export interface OrderData {
  _id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  shippingAddress: string;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  voucherCode?: string | null;
  discountAmount: number;
  totalAmount: number;
  orderStatus: "PENDING" | "CONFIRMED" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: "COD" | "BANK_TRANSFER" | "VNPAY" | "MOMO" | "QR";
  shippingMethod?: string;
  timeline?: TimelineItem[];
  createdAt: string;
}

interface OrderDetailModalProps {
  order: OrderData | null;
  onClose: () => void;
  onCancelTrigger: (orderId: string) => void;
  onNotifySuccess: () => Promise<void>;
  getStatusBadge: (status: OrderData["orderStatus"]) => React.ReactNode;
  formatDate: (dateStr: string) => string;
  formatPrice: (amount: number) => string;
}

export function OrderDetailModal({
  order,
  onClose,
  onCancelTrigger,
  onNotifySuccess,
  getStatusBadge,
  formatDate,
  formatPrice
}: OrderDetailModalProps) {
  // Local active states for payment notification and clipboard copies
  const [notifyingPayment, setNotifyingPayment] = useState(false);
  const [paymentNotifySuccess, setPaymentNotifySuccess] = useState(false);
  const [paymentNotifyError, setPaymentNotifyError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!order) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleNotifyPayment = async () => {
    setNotifyingPayment(true);
    setPaymentNotifyError("");
    setPaymentNotifySuccess(false);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/orders/${order._id}/notify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPaymentNotifySuccess(true);
        await onNotifySuccess();
      } else {
        setPaymentNotifyError(data.message || "Không thể gửi thông báo chuyển khoản.");
      }
    } catch (err) {
      setPaymentNotifyError("Lỗi kết nối máy chủ khi gửi thông báo.");
    } finally {
      setNotifyingPayment(false);
    }
  };

  const getOrderSteps = (status: OrderData["orderStatus"]) => {
    const steps = [
      { key: "PENDING", label: "Chờ duyệt" },
      { key: "CONFIRMED", label: "Xác nhận" },
      { key: "SHIPPING", label: "Đang giao" },
      { key: "DELIVERED", label: "Hoàn tất" }
    ];

    if (status === "CANCELLED") {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-700 text-xs font-semibold uppercase tracking-wider justify-center">
          <XCircle className="w-4 h-4" /> Đơn hàng đã bị hủy bỏ
        </div>
      );
    }

    const currentIdx = steps.findIndex(s => s.key === status);

    return (
      <div className="flex items-center justify-between w-full py-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx || status === "DELIVERED";
          const isActive = step.key === status;
          
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center relative z-10 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
                  isCompleted 
                    ? "bg-[#2e4c7e] border-[#2e4c7e] text-white shadow-md shadow-[#2e4c7e]/20" 
                    : isActive 
                    ? "bg-white border-[#2e4c7e] text-[#2e4c7e] font-black ring-4 ring-[#eef2f6]" 
                    : "bg-white border-gray-200 text-gray-400"
                }`}>
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className={`text-[10px] md:text-xs mt-1.5 font-semibold uppercase tracking-wider ${
                  isActive ? "text-[#2e4c7e] font-bold" : isCompleted ? "text-[#2e4c7e]" : "text-gray-400"
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-200 -mx-4 md:-mx-8 relative -top-3">
                  <div className="absolute top-0 left-0 bottom-0 bg-[#2e4c7e] transition-all duration-500" style={{
                    width: isCompleted ? "100%" : "0%"
                  }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#2b2b2b]/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-4xl my-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] md:max-h-[85vh]">
        
        {/* Header Modal */}
        <div className="bg-[#FAF8F6] border-b border-[#F1EEE8] px-6 py-4 flex justify-between items-center shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-[#777] uppercase tracking-widest leading-none">Mã đơn hàng</span>
              <span className="text-base font-bold text-[#2b2b2b] tracking-wider leading-none">
                {order.orderCode}
              </span>
            </div>
            <p className="text-xs text-[#777]">Đặt ngày: {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-4">
            {getStatusBadge(order.orderStatus)}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-[#2b2b2b] hover:bg-gray-100 rounded-full transition-colors cursor-pointer animate-in fade-in"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Modal (Scrollable Content) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin">
          
          {/* Progress Stepper */}
          <div className="bg-white border border-[#e2e8f0]/50 rounded-2xl p-6 shadow-sm">
            <h4 className="text-[11px] font-bold text-[#2b2b2b] uppercase tracking-widest mb-4">Trạng thái đơn hàng</h4>
            {getOrderSteps(order.orderStatus)}
          </div>

          {/* Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
            
            {/* Cột trái: Sản phẩm & Timeline (3/5) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Danh sách sản phẩm */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#2b2b2b] uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#2e4c7e]" /> Sản phẩm đã chọn
                </h4>
                <div className="bg-white border border-[#e2e8f0]/40 rounded-2xl divide-y divide-[#F1EEE8] overflow-hidden shadow-sm">
                  {order.items.map((item, index) => (
                    <div key={index} className="p-4 flex gap-4 items-center hover:bg-[#FAF8F6]/20 transition-colors">
                      <div className="w-14 h-14 rounded-lg border border-gray-150 overflow-hidden bg-gray-50 shrink-0 shadow-inner">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-[10px]">
                            No Pic
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-semibold text-[#2b2b2b] truncate">
                          {item.name}
                        </h5>
                        <div className="flex justify-between items-center mt-1 text-[11px] text-[#777]">
                          <span>Số lượng: <span className="font-bold text-[#2b2b2b]">{item.quantity}</span></span>
                          <span className="font-semibold text-[#2b2b2b]">{formatPrice(item.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hành trình đơn hàng (Timeline) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#2b2b2b] uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2e4c7e]" /> Hành trình đơn hàng
                </h4>
                <div className="bg-white border border-[#e2e8f0]/40 rounded-2xl p-6 shadow-sm">
                  <div className="relative pl-6 border-l-2 border-dashed border-[#FAF0E6] space-y-6">
                    {(order.timeline ? [...order.timeline].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()) : []).map((t, idx) => {
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
                          <span className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all duration-300 ${
                            isLatest 
                              ? "bg-[#2e4c7e] border-[#2e4c7e] text-white shadow-md shadow-[#2e4c7e]/30 ring-4 ring-[#eef2f6]" 
                              : "bg-white border-gray-300 text-gray-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLatest ? "bg-white animate-pulse" : "bg-gray-300"}`} />
                          </span>
                          
                          <div className="space-y-1">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                              <span className={`text-xs font-bold ${isLatest ? "text-[#2b2b2b]" : "text-gray-500"}`}>
                                {getTimelineLabel(t.status)}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {formatDate(t.time)}
                              </span>
                            </div>
                            {t.note && (
                              <p className="text-[11px] text-[#777] bg-[#FAF8F6]/60 rounded-lg p-2 border border-[#FAF8F6] leading-relaxed">
                                {t.note}
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

            {/* Cột phải: Thông tin nhận hàng & Chi tiết thanh toán & QR Chuyển khoản (2/5) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Thông tin nhận hàng */}
              <div className="bg-[#FAF8F6]/50 border border-[#e2e8f0]/50 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-[#2b2b2b] uppercase tracking-wider border-b border-[#F1EEE8] pb-2">
                  Thông tin nhận hàng
                </h4>
                <div className="text-xs space-y-2.5 text-[#333]">
                  <div>
                    <span className="text-[#777] block text-[10px] uppercase tracking-wider font-semibold">Người nhận:</span>
                    <span className="font-bold text-[#2b2b2b]">{order.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[#777] block text-[10px] uppercase tracking-wider font-semibold">Số điện thoại:</span>
                    <span className="font-semibold text-[#2b2b2b]">{order.phone}</span>
                  </div>
                  <div>
                    <span className="text-[#777] block text-[10px] uppercase tracking-wider font-semibold">Địa chỉ nhận hàng:</span>
                    <p className="text-secondary-foreground font-medium mt-0.5 leading-relaxed">{order.shippingAddress}</p>
                  </div>
                  {order.shippingMethod && (
                    <div>
                      <span className="text-[#777] block text-[10px] uppercase tracking-wider font-semibold">Phương thức giao hàng:</span>
                      <span className="font-semibold text-[#2b2b2b]">{order.shippingMethod}</span>
                    </div>
                  )}
                  {order.note && (
                    <div>
                      <span className="text-[#777] block text-[10px] uppercase tracking-wider font-semibold">Ghi chú từ khách hàng:</span>
                      <p className="italic text-[#777] bg-white border border-[#FAF8F6] p-2 rounded-lg mt-0.5 leading-relaxed">
                        "{order.note}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* VietQR Transfer Panel (Nếu là thanh toán chuyển khoản và chưa thanh toán) */}
              {order.paymentMethod === "QR" && order.paymentStatus === "PENDING" && (
                <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="text-center space-y-1">
                    <h4 className="text-xs font-bold text-[#2e4c7e] uppercase tracking-wider">Thông tin chuyển khoản QR</h4>
                    <p className="text-[10px] text-[#777]">Quét mã VietQR bên dưới để thanh toán nhanh chóng</p>
                  </div>
                  
                  {/* Live VietQR generation */}
                  <div className="w-40 h-40 bg-white border border-[#e2e8f0]/60 rounded-xl overflow-hidden mx-auto p-2 shadow-sm flex items-center justify-center">
                    <img 
                      src={`https://img.vietqr.io/image/MB-0965491328-compact2.png?amount=${order.totalAmount}&addInfo=KhamHoa%20${order.orderCode}&accountName=Kham%20Hoa%20Store`} 
                      alt="VietQR Payment"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Bank Text Details */}
                  <div className="text-xs space-y-2 border-t border-[#FAF8F6] pt-3 text-[#333]">
                    <div className="flex justify-between items-center py-1 border-b border-[#FAF8F6]">
                      <span className="text-[#777]">Ngân hàng:</span>
                      <span className="font-semibold text-right">MB Bank</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#FAF8F6]">
                      <span className="text-[#777]">Số tài khoản:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[#2b2b2b]">0965491328</span>
                        <button 
                          type="button" 
                          onClick={() => handleCopy("0965491328", "account")}
                          className="p-1 hover:bg-[#FAF8F6] rounded transition-colors text-gray-400 hover:text-[#2e4c7e] cursor-pointer"
                        >
                          {copiedField === "account" ? <span className="text-[10px] text-green-600 font-semibold">Đã chép</span> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#FAF8F6]">
                      <span className="text-[#777]">Chủ tài khoản:</span>
                      <span className="font-semibold uppercase text-right">KHẨM HOA STORE</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#FAF8F6]">
                      <span className="text-[#777]">Số tiền:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-[#2e4c7e]">{formatPrice(order.totalAmount)}</span>
                        <button 
                          type="button" 
                          onClick={() => handleCopy(order.totalAmount.toString(), "amount")}
                          className="p-1 hover:bg-[#FAF8F6] rounded transition-colors text-gray-400 hover:text-[#2e4c7e] cursor-pointer"
                        >
                          {copiedField === "amount" ? <span className="text-[10px] text-green-600 font-semibold">Đã chép</span> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#777]">Nội dung:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-[#2b2b2b]">KhamHoa {order.orderCode}</span>
                        <button 
                          type="button" 
                          onClick={() => handleCopy(`KhamHoa ${order.orderCode}`, "content")}
                          className="p-1 hover:bg-[#FAF8F6] rounded transition-colors text-gray-400 hover:text-[#2e4c7e] cursor-pointer"
                        >
                          {copiedField === "content" ? <span className="text-[10px] text-green-600 font-semibold">Đã chép</span> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động Báo chuyển khoản */}
                  <div className="pt-2 border-t border-[#FAF8F6]">
                    {order.timeline?.some(t => t.status === "PAYMENT_NOTIFIED") ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-[10px] text-amber-800 font-medium leading-relaxed">
                        ✓ Quý khách đã gửi thông báo chuyển khoản. Vui lòng chờ vài phút để Admin xác nhận giao dịch.
                      </div>
                    ) : paymentNotifySuccess ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center text-[10px] text-green-800 font-medium leading-relaxed">
                        ✓ Gửi thông báo chuyển khoản thành công! Cảm ơn Quý khách.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled={notifyingPayment}
                          onClick={handleNotifyPayment}
                          className="w-full py-2.5 bg-[#2e4c7e] hover:bg-[#b58f50] text-white text-xs font-bold rounded-full tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#2e4c7e]/10"
                        >
                          {notifyingPayment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Tôi đã chuyển khoản
                        </button>
                        {paymentNotifyError && (
                          <p className="text-[10px] text-red-600 text-center">{paymentNotifyError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chi tiết thanh toán */}
              <div className="bg-[#FAF8F6]/30 border border-[#e2e8f0]/50 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-[#2b2b2b] uppercase tracking-wider border-b border-[#F1EEE8] pb-2">
                  Chi tiết thanh toán
                </h4>
                <div className="text-xs space-y-2 text-[#333]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#777]">Tạm tính sản phẩm:</span>
                    <span className="font-medium">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#777]">Phí vận chuyển:</span>
                    <span className="font-medium">{formatPrice(order.shippingFee || 30000)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-medium bg-rose-50/50 p-2 rounded-lg border border-rose-100/50">
                      <div className="flex items-center gap-1">
                        <span>Voucher giảm giá:</span>
                        {order.voucherCode && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {order.voucherCode}
                          </span>
                        )}
                      </div>
                      <span>-{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-[#F1EEE8]">
                    <span className="text-xs font-bold text-[#2b2b2b] uppercase tracking-wider">Tổng thanh toán:</span>
                    <span className="text-base font-serif font-extrabold text-[#2e4c7e] tracking-wider">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                  <div className="pt-2 flex justify-between items-center text-[10px] text-[#777]">
                    <span>Hình thức thanh toán:</span>
                    <span className="font-bold text-[#2b2b2b]">
                      {order.paymentMethod === "QR" ? "Chuyển khoản VietQR" : "Thanh toán COD"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#777]">
                    <span>Trạng thái thanh toán:</span>
                    <span className={`font-bold ${
                      order.paymentStatus === "PAID" ? "text-green-600" : "text-amber-600"
                    }`}>
                      {order.paymentStatus === "PAID" ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Footer Modal */}
        <div className="bg-[#FAF8F6] border-t border-[#F1EEE8] px-6 py-4.5 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="text-[11px] text-[#777] text-center sm:text-left">
            Nếu Quý khách cần hỗ trợ thêm, vui lòng liên hệ hotline <span className="font-semibold text-[#2b2b2b]">0965491328</span>.
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            
            {/* Nút hủy đơn hàng từ trong modal chi tiết */}
            {order.orderStatus === "PENDING" && (
              <button
                type="button"
                onClick={() => onCancelTrigger(order._id)}
                className="px-5 py-2 text-red-600 border border-red-200 hover:border-red-400 hover:bg-red-50/20 text-xs font-semibold rounded-full transition-all cursor-pointer w-full sm:w-auto"
              >
                Hủy đơn hàng
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-[#2e4c7e] hover:bg-[#c49490] text-white text-xs font-bold rounded-full tracking-wider transition-all cursor-pointer w-full sm:w-auto text-center shadow-md shadow-[#2e4c7e]/10 active:scale-[0.98]"
            >
              Đóng chi tiết
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

