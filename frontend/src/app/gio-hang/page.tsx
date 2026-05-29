"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/ToastContext";
import {
  Trash2, ShoppingBag, Plus, Minus, ArrowLeft, Ticket, Check,
  AlertCircle, User, Phone, MapPin, FileText, CreditCard, Copy, Loader2,
  ChevronRight, ShieldCheck, Truck, X, CheckCircle2
} from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";

interface VoucherType {
  _id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  description?: string;
}

interface CreatedOrderData {
  _id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  paymentMethod: string;
  totalAmount: number;
}

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, toggleSelect, toggleSelectAll, removeSelectedFromCart } = useCart();
  const { user } = useAuth(); // Prefill user profile

  const [voucherCode, setVoucherCode] = useState("");
  const [availableVouchers, setAvailableVouchers] = useState<VoucherType[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  // Delivery & Payment States
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "QR">("COD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Success Order states
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderData | null>(null);
  const [qrStep, setQrStep] = useState(false);

  // Cấu hình tài khoản ngân hàng VietQR động từ Backend
  const [paymentConfig, setPaymentConfig] = useState<{
    bankName: string;
    bankAccountNo: string;
    bankAccountName: string;
    bankId: string;
  }>({
    bankName: "MB",
    bankAccountNo: "0000803885585",
    bankAccountName: "NGUYEN THI DUYEN",
    bankId: "970422"
  });

  // Notify QR payment state
  const [notifyingPayment, setNotifyingPayment] = useState(false);
  const [paymentNotifySuccess, setPaymentNotifySuccess] = useState(false);
  const toast = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Autofill checkout details from user profile
  useEffect(() => {
    if (user) {
      setCustomerName(user.name || "");
      setPhone(user.phone || "");
      setShippingAddress(user.address || "");
    }
  }, [user]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleQrPaymentNotify = async () => {
    if (!createdOrder) return;
    setNotifyingPayment(true);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/orders/${createdOrder._id}/notify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPaymentNotifySuccess(true);
        setTimeout(() => {
          setQrStep(false);
          setCheckoutSuccess(true);
        }, 1500);
      } else {
        toast.error(data.message || "Không thể gửi thông báo chuyển khoản.");
      }
    } catch (err) {
      toast.error("Lỗi kết nối khi gửi thông báo chuyển khoản.");
    } finally {
      setNotifyingPayment(false);
    }
  };

  // Fetch available vouchers
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/vouchers`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAvailableVouchers(data.data);
        }
      })
      .catch((err) => console.error("Error loading vouchers in cart:", err));
  }, []);

  // Fetch thông tin cấu hình tài khoản ngân hàng VietQR động
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/orders/payment-config`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPaymentConfig(data.data);
        }
      })
      .catch((err) => console.error("Error loading bank payment config:", err));
  }, []);

  const handleApplyVoucher = (code: string) => {
    if (!code) return;
    setLoadingVoucher(true);
    setVoucherError(null);

    fetch(`${API_BASE_URL}/api/vouchers/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: code,
        orderValue: cartTotal
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAppliedVoucher({
            code: data.data.code,
            discountAmount: data.data.discountAmount,
            description: data.data.description || ""
          });
          setVoucherCode("");
        } else {
          setVoucherError(data.message || "Không thể áp dụng mã giảm giá này");
          setAppliedVoucher(null);
        }
        setLoadingVoucher(false);
      })
      .catch((err) => {
        console.error("Error applying voucher:", err);
        setVoucherError("Đã xảy ra lỗi khi áp dụng mã giảm giá");
        setLoadingVoucher(false);
      });
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError(null);
  };

  // Re-calculate voucher discount if cartTotal changes
  useEffect(() => {
    if (appliedVoucher) {
      fetch(`${API_BASE_URL}/api/vouchers/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: appliedVoucher.code,
          orderValue: cartTotal
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setAppliedVoucher({
              code: data.data.code,
              discountAmount: data.data.discountAmount,
              description: data.data.description || ""
            });
          } else {
            setAppliedVoucher(null);
          }
        })
        .catch(() => setAppliedVoucher(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartTotal]);

  const shippingFee = cartTotal >= 500000 || cartTotal === 0 ? 0 : 30000;
  const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const grandTotal = Math.max(0, cartTotal + shippingFee - discount);

  const handleCheckout = async () => {
    const selectedItems = cartItems.filter(i => i.selected !== false);
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }

    if (!customerName.trim()) {
      setCheckoutError("Vui lòng nhập tên người nhận hàng.");
      return;
    }
    if (!phone.trim()) {
      setCheckoutError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!shippingAddress.trim()) {
      setCheckoutError("Vui lòng nhập địa chỉ giao hàng.");
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    const orderItems = selectedItems.map(item => ({
      productId: item.id,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }));

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          phone,
          shippingAddress,
          note,
          paymentMethod,
          items: orderItems,
          voucherCode: appliedVoucher ? appliedVoucher.code : undefined
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCreatedOrder(data.data);
        removeSelectedFromCart();
        handleRemoveVoucher();

        if (paymentMethod === "QR") {
          setQrStep(true);
        } else {
          setCheckoutSuccess(true);
        }

        // Fix scroll jumping to footer issue
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setCheckoutError(data.message || "Đặt hàng thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      setCheckoutError("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại đường truyền.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#faf8f6] pt-24">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {checkoutSuccess ? (
            <div className="bg-white rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-xl shadow-[#2e4c7e]/5 border border-[#e8d8c3]/40 mt-10 space-y-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100 shadow-inner">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-serif text-[#333] mb-4">Đặt Hàng Thành Công!</h1>
                <p className="text-[10px] text-[#aaa] font-bold uppercase tracking-wider">Trạng thái: Đơn hàng đang được xử lý</p>
              </div>

              {createdOrder && (
                <div className="bg-[#faf8f6] border border-[#e8d8c3]/40 rounded-2xl p-5 text-left text-xs space-y-2.5 text-[#555] animate-in slide-in-from-bottom-2 duration-400">
                  <div className="flex justify-between border-b border-[#e2e8f0] pb-2">
                    <span className="text-[#888]">Mã đơn hàng:</span>
                    <span className="font-mono font-bold text-[#333] tracking-wider">{createdOrder.orderCode}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#e2e8f0] pb-2">
                    <span className="text-[#888]">Người nhận:</span>
                    <span className="font-semibold text-[#333]">{createdOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#e2e8f0] pb-2">
                    <span className="text-[#888]">Số điện thoại:</span>
                    <span className="font-semibold text-[#333]">{createdOrder.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#e2e8f0] pb-2">
                    <span className="text-[#888]">Phương thức thanh toán:</span>
                    <span className="font-bold text-[#2e4c7e]">{createdOrder.paymentMethod === "QR" ? "Chuyển khoản VietQR (Đã báo chuyển khoản)" : "Thanh toán COD (Nhận hàng trả tiền)"}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-serif text-sm">
                    <span className="text-[#333] font-bold">Tổng thanh toán:</span>
                    <span className="font-bold text-[#2e4c7e]">{createdOrder.totalAmount.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                </div>
              )}

              <p className="text-sm text-[#777] leading-relaxed mb-8">
                Cảm ơn bạn đã lựa chọn mua sắm trang sức xà cừ tại Kham Hoa Store. Thông báo đơn hàng mới đã được chuyển cho quản trị viên và chúng tôi sẽ sớm liên hệ xác nhận.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <Link
                  href="/"
                  onClick={() => {
                    setCheckoutSuccess(false);
                    setCreatedOrder(null);
                  }}
                  className="bg-[#faf8f6] hover:bg-[#eae6e0] text-[#777] border border-[#e8d8c3] px-6 py-3 rounded-xl text-xs font-semibold tracking-wider transition-colors text-center cursor-pointer"
                >
                  Tiếp tục mua sắm
                </Link>
                <Link
                  href="/account/orders"
                  className="bg-[#2e4c7e] hover:bg-[#1b2a4a] text-white px-6 py-3 rounded-xl text-xs font-semibold tracking-wider transition-colors shadow-lg shadow-[#2e4c7e]/15 text-center cursor-pointer"
                >
                  Xem lịch sử đơn hàng
                </Link>
              </div>
            </div>
          ) : qrStep && createdOrder ? (
            <div className="bg-white rounded-3xl p-6 md:p-10 max-w-xl mx-auto shadow-xl shadow-[#2e4c7e]/5 border border-[#e8d8c3]/40 mt-10 space-y-6 animate-in fade-in duration-300">
              <div className="text-center space-y-2">
                <h1 className="text-xl md:text-2xl font-serif text-[#333]">Thanh Toán Chuyển Khoản</h1>
                <p className="text-xs text-[#777]">Quý khách vui lòng chuyển khoản đúng số tiền và nội dung để hệ thống duyệt tự động</p>
              </div>

              {/* MB Bank VietQR Scan */}
              <div className="w-125 h-125 bg-white border border-[#e8d8c3] rounded-2xl overflow-hidden mx-auto p-2.5 shadow-inner flex items-center justify-center">
                <img
                  src={`https://img.vietqr.io/image/${paymentConfig.bankName}-${paymentConfig.bankAccountNo}-compact2.png?amount=${createdOrder.totalAmount}&addInfo=KhamHoa%20${createdOrder.orderCode}&accountName=${encodeURIComponent(paymentConfig.bankAccountName)}`}
                  alt={`VietQR ${paymentConfig.bankName} Bank`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Bank Details Table */}
              <div className="bg-[#faf8f6] border border-[#e8d8c3]/40 rounded-2xl p-4 text-xs space-y-2 text-[#333] animate-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center py-1 border-b border-[#e2e8f0]">
                  <span className="text-[#777]">Ngân hàng:</span>
                  <span className="font-semibold">{paymentConfig.bankName} Bank</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#e2e8f0]">
                  <span className="text-[#777]">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{paymentConfig.bankAccountNo}</span>
                    <button
                      onClick={() => handleCopy(paymentConfig.bankAccountNo, "account")}
                      className="p-1 hover:bg-[#eae6e0] rounded transition-colors text-gray-400 hover:text-[#2e4c7e] cursor-pointer"
                    >
                      {copiedField === "account" ? <span className="text-[10px] text-green-600 font-bold">Đã chép</span> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#e2e8f0]">
                  <span className="text-[#777]">Chủ tài khoản:</span>
                  <span className="font-bold uppercase">{paymentConfig.bankAccountName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#e2e8f0]">
                  <span className="text-[#777]">Số tiền:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#2e4c7e]">{createdOrder.totalAmount.toLocaleString("vi-VN")}₫</span>
                    <button
                      onClick={() => handleCopy(createdOrder.totalAmount.toString(), "amount")}
                      className="p-1 hover:bg-[#eae6e0] rounded transition-colors text-gray-400 hover:text-[#2e4c7e] cursor-pointer"
                    >
                      {copiedField === "amount" ? <span className="text-[10px] text-green-600 font-bold">Đã chép</span> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#777]">Nội dung:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#333]">KhamHoa {createdOrder.orderCode}</span>
                    <button
                      onClick={() => handleCopy(`KhamHoa ${createdOrder.orderCode}`, "content")}
                      className="p-1 hover:bg-[#eae6e0] rounded transition-colors text-gray-400 hover:text-[#2e4c7e] cursor-pointer"
                    >
                      {copiedField === "content" ? <span className="text-[10px] text-green-600 font-bold">Đã chép</span> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {paymentNotifySuccess ? (
                  <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-center text-xs text-green-800 font-semibold leading-relaxed animate-in fade-in">
                    ✓ Gửi thông báo chuyển khoản thành công! Đang chuyển hướng...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleQrPaymentNotify}
                      disabled={notifyingPayment}
                      className="w-full bg-[#2e4c7e] hover:bg-[#1b2a4a] text-white py-3.5 rounded-xl text-sm font-semibold tracking-wider transition-colors shadow-lg shadow-[#2e4c7e]/15 flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
                    >
                      {notifyingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                      Tôi đã chuyển khoản xong
                    </button>
                    <button
                      onClick={() => {
                        setQrStep(false);
                        setCheckoutSuccess(true);
                      }}
                      className="w-full border border-gray-200 text-gray-400 hover:text-gray-500 py-2.5 rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer"
                    >
                      Bỏ qua và thông báo sau
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-serif text-[#333] mb-8">Giỏ Hàng Của Bạn</h1>

              {cartItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-[#e8d8c3]/20 shadow-sm">
                  <div className="w-16 h-16 bg-[#eef2f6]/60 rounded-full flex items-center justify-center mx-auto mb-6 text-[#2e4c7e]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="text-[#777] text-base mb-8 font-medium">Giỏ hàng của bạn đang trống.</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-[#2e4c7e] hover:bg-[#1b2a4a] text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Khám phá sản phẩm
                  </Link>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Left Column: Items */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Header with Select All */}
                    <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-[#e8d8c3]/30 shadow-sm">
                      <input
                        type="checkbox"
                        checked={cartItems.length > 0 && cartItems.every(i => i.selected !== false)}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        className="w-4 h-4 accent-[#2e4c7e] cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-[#333]">Chọn tất cả ({cartItems.length} sản phẩm)</span>
                    </div>

                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-4 border border-[#e8d8c3]/30 shadow-sm flex gap-4 items-center"
                      >
                        <input
                          type="checkbox"
                          checked={item.selected !== false}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 accent-[#2e4c7e] cursor-pointer"
                        />
                        {/* Image */}
                        <div className="relative w-20 h-20 bg-[#faf8f6] rounded-xl overflow-hidden shrink-0 border border-[#e2e8f0]">
                          <Image src={item.image} fill alt={item.name} className="object-contain p-2" />
                        </div>

                        {/* Title & category */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[#333] truncate">{item.name}</h3>
                          <p className="text-[11px] text-[#999] font-medium uppercase mt-0.5">
                            {item.categoryName || "Mỹ Nghệ"}
                          </p>
                          <div className="text-xs text-[#2e4c7e] font-bold mt-1.5">
                            {item.price.toLocaleString("vi-VN")}₫
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center border border-[#e2d8cf] rounded-lg overflow-hidden bg-[#faf8f6]">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 text-[#777] hover:bg-[#eef2f6] hover:text-[#2e4c7e] transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-xs font-bold text-[#333] w-8 text-center select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 text-[#777] hover:bg-[#eef2f6] hover:text-[#2e4c7e] transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-sm font-bold text-[#333] hidden sm:block w-24 text-right">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-[#aaa] hover:text-red-500 transition-colors cursor-pointer"
                          aria-label="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Back link */}
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 text-xs text-[#2e4c7e] font-bold hover:underline"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Tiếp tục chọn thêm sản phẩm
                    </Link>
                  </div>

                  {/* Right Column: Checkout Info, Payment Method, Voucher & Summary */}
                  <div className="space-y-6">

                    {/* A. THÔNG TIN GIAO HÀNG */}
                    <div className="bg-white rounded-3xl p-5 border border-[#e8d8c3]/40 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-sm font-serif text-[#333] font-bold pb-2 border-b border-[#e2e8f0]">
                        <User className="w-4 h-4 text-[#2e4c7e]" /> Thông Tin Nhận Hàng
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#777] uppercase tracking-wider">Họ & Tên người nhận</label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              placeholder="Nhập họ tên người nhận..."
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-[#faf8f6] border border-[#e2d8cf] rounded-xl text-xs focus:outline-none focus:border-[#2e4c7e] font-medium text-[#333]"
                            />
                            <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#777] uppercase tracking-wider">Số điện thoại</label>
                          <div className="relative">
                            <input
                              type="tel"
                              required
                              placeholder="Nhập số điện thoại..."
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-[#faf8f6] border border-[#e2d8cf] rounded-xl text-xs focus:outline-none focus:border-[#2e4c7e] font-medium text-[#333]"
                            />
                            <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#777] uppercase tracking-wider">Địa chỉ giao hàng</label>
                          <div className="relative">
                            <textarea
                              required
                              placeholder="Nhập địa chỉ giao hàng chi tiết..."
                              value={shippingAddress}
                              onChange={(e) => setShippingAddress(e.target.value)}
                              rows={2}
                              className="w-full pl-9 pr-3 py-2 bg-[#faf8f6] border border-[#e2d8cf] rounded-xl text-xs focus:outline-none focus:border-[#2e4c7e] resize-none font-medium text-[#333] leading-relaxed"
                            />
                            <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#777] uppercase tracking-wider">Ghi chú đơn hàng (Tùy chọn)</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Ví dụ: Giao giờ hành chính..."
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-[#faf8f6] border border-[#e2d8cf] rounded-xl text-xs focus:outline-none focus:border-[#2e4c7e] font-medium text-[#333]"
                            />
                            <FileText className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* B. PHƯƠNG THỨC THANH TOÁN */}
                    <div className="bg-white rounded-3xl p-5 border border-[#e8d8c3]/40 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-sm font-serif text-[#333] font-bold pb-2 border-b border-[#e2e8f0]">
                        <CreditCard className="w-4 h-4 text-[#2e4c7e]" /> Phương Thức Thanh Toán
                      </div>

                      <div className="space-y-2.5">
                        {/* Option COD */}
                        <label
                          onClick={() => setPaymentMethod("COD")}
                          className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${paymentMethod === "COD"
                            ? "bg-[#faf8f6] border-[#2e4c7e] ring-1 ring-[#2e4c7e]"
                            : "border-[#e8d8c3]/60 hover:bg-[#faf8f6]/30"
                            }`}
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            checked={paymentMethod === "COD"}
                            onChange={() => setPaymentMethod("COD")}
                            className="mt-0.5 accent-[#2e4c7e] cursor-pointer"
                          />
                          <div>
                            <p className="text-xs font-bold text-[#333]">Thanh toán sau khi nhận hàng (COD)</p>
                            <p className="text-[10px] text-[#888] mt-0.5">Thanh toán bằng tiền mặt khi shipper giao hàng tận nơi.</p>
                          </div>
                        </label>

                        {/* Option QR Code */}
                        <label
                          onClick={() => setPaymentMethod("QR")}
                          className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${paymentMethod === "QR"
                            ? "bg-[#faf8f6] border-[#2e4c7e] ring-1 ring-[#2e4c7e]"
                            : "border-[#e8d8c3]/60 hover:bg-[#faf8f6]/30"
                            }`}
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            checked={paymentMethod === "QR"}
                            onChange={() => setPaymentMethod("QR")}
                            className="mt-0.5 accent-[#2e4c7e] cursor-pointer"
                          />
                          <div>
                            <p className="text-xs font-bold text-[#333]">Thanh toán chuyển khoản VietQR</p>
                            <p className="text-[10px] text-[#888] mt-0.5">Quét mã chuyển khoản tức thì bằng mọi ứng dụng ngân hàng.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Voucher Application Block */}
                    <div className="bg-white rounded-3xl p-5 border border-[#e8d8c3]/40 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 text-sm font-serif text-[#333] font-bold pb-2 border-b border-[#e2e8f0]">
                        <Ticket className="w-4 h-4 text-[#2e4c7e]" /> Mã Giảm Giá
                      </div>

                      {appliedVoucher ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex justify-between items-center animate-in fade-in">
                          <div>
                            <div className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Đã áp dụng: {appliedVoucher.code}
                            </div>
                            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                              {appliedVoucher.description}
                            </p>
                          </div>
                          <button
                            onClick={handleRemoveVoucher}
                            className="text-xs font-bold text-emerald-800 hover:underline hover:text-red-500 cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Nhập mã voucher..."
                              value={voucherCode}
                              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                              className="flex-1 bg-[#faf8f6] border border-[#e2d8cf] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2e4c7e] font-mono font-bold"
                            />
                            <button
                              onClick={() => handleApplyVoucher(voucherCode)}
                              disabled={loadingVoucher || !voucherCode}
                              className="bg-[#2e4c7e] hover:bg-[#1b2a4a] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
                            >
                              Áp dụng
                            </button>
                          </div>

                          {voucherError && (
                            <div className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {voucherError}
                            </div>
                          )}

                          {/* Quick selection of available database vouchers */}
                          {availableVouchers.length > 0 && (
                            <div className="pt-2">
                              <p className="text-[10px] text-[#aaa] font-bold mb-1.5 uppercase tracking-wider">Voucher có sẵn:</p>
                              <div className="flex flex-wrap gap-2">
                                {availableVouchers.map((v) => (
                                  <button
                                    key={v._id}
                                    onClick={() => handleApplyVoucher(v.code)}
                                    className="text-[10px] font-mono font-bold bg-[#eef2f6] text-[#2e4c7e] border border-[#2e4c7e]/20 px-2.5 py-1 rounded-lg hover:bg-[#2e4c7e] hover:text-white transition-all cursor-pointer"
                                  >
                                    {v.code}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-3xl p-6 border border-[#e8d8c3]/40 shadow-sm space-y-4">
                      <h2 className="text-base font-serif text-[#333] font-bold pb-2 border-b border-[#e2e8f0]">
                        Tóm Tắt Đơn Hàng ({cartItems.filter(i => i.selected !== false).reduce((acc, i) => acc + i.quantity, 0)} sản phẩm)
                      </h2>

                      <div className="space-y-2.5 text-xs text-[#666] font-medium">
                        <div className="flex justify-between">
                          <span>Tạm tính</span>
                          <span className="text-[#333] font-bold">{cartTotal.toLocaleString("vi-VN")}₫</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phí vận chuyển</span>
                          <span className="text-[#333] font-bold">
                            {shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString("vi-VN")}₫`}
                          </span>
                        </div>
                        {appliedVoucher && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Mã giảm giá ({appliedVoucher.code})</span>
                            <span className="font-bold">-{discount.toLocaleString("vi-VN")}₫</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-[#e2e8f0] pt-4 flex justify-between items-center">
                        <span className="text-sm font-serif text-[#333] font-bold">Tổng thanh toán</span>
                        <span className="text-xl font-bold text-[#2e4c7e]">
                          {grandTotal.toLocaleString("vi-VN")}₫
                        </span>
                      </div>

                      {shippingFee > 0 && (
                        <div className="text-[10px] text-[#999] bg-[#faf8f6] p-2.5 rounded-xl border border-[#e2e8f0]/40 text-center font-medium leading-relaxed">
                          Mua thêm <span className="font-bold text-[#2e4c7e]">{(500000 - cartTotal).toLocaleString("vi-VN")}₫</span> để được <span className="font-bold text-emerald-600">Miễn Phí Vận Chuyển</span>!
                        </div>
                      )}

                      {checkoutError && (
                        <div className="p-3 bg-red-50 border-l-2 border-red-500 rounded-xl text-xs text-red-600 font-semibold leading-normal animate-in fade-in">
                          {checkoutError}
                        </div>
                      )}

                      <button
                        onClick={handleCheckout}
                        disabled={isSubmitting}
                        className="w-full bg-[#2e4c7e] hover:bg-[#1b2a4a] text-white py-4 rounded-xl text-sm font-semibold tracking-wider shadow-lg shadow-[#2e4c7e]/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300 disabled:text-gray-500"
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Tiến Hành Đặt Hàng
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
