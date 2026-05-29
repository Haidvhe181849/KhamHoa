"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";

interface CancelOrderModalProps {
  orderId: string | null;
  onClose: () => void;
  onCancelSuccess: () => Promise<void>;
}

export function CancelOrderModal({ orderId, onClose, onCancelSuccess }: CancelOrderModalProps) {
  const [cancelReason, setCancelReason] = useState("Tôi đổi ý không mua nữa");
  const [customReason, setCustomReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  if (!orderId) return null;

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setCancelError("");
    setCancelLoading(true);

    const finalReason = cancelReason === "other" ? customReason.trim() : cancelReason;
    if (cancelReason === "other" && !finalReason) {
      setCancelError("Vui lòng ghi rõ lý do hủy đơn hàng.");
      setCancelLoading(false);
      return;
    }

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: finalReason }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await onCancelSuccess();
        onClose();
      } else {
        setCancelError(data.message || "Không thể thực hiện hủy đơn hàng.");
      }
    } catch (err) {
      setCancelError("Kết nối máy chủ thất bại.");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2b2b2b]/30 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-md p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-serif font-semibold text-[#2b2b2b] mb-2">
          Xác nhận hủy đơn hàng
        </h3>
        <p className="text-xs text-secondary-foreground mb-6 leading-relaxed">
          * Lưu ý: Việc hủy đơn hàng ở trạng thái đang chờ duyệt sẽ diễn ra lập tức và không thể hoàn tác. Quý khách vui lòng cho biết lý do để giúp chúng tôi hoàn thiện chất lượng:
        </p>

        <form onSubmit={handleCancelSubmit} className="space-y-4">
          {/* Dropdown lý do hủy */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#2b2b2b] tracking-wider uppercase">
              Lý do hủy đơn hàng
            </label>
            <select
              disabled={cancelLoading}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#eef2f6] border border-[#e2e8f0] rounded-xl text-sm text-[#2b2b2b] focus:outline-none focus:border-[#2e4c7e] focus:ring-1 focus:ring-[#2e4c7e] transition-all cursor-pointer font-medium"
            >
              <option value="Tôi đổi ý không mua nữa">Tôi đổi ý không mua nữa</option>
              <option value="Tôi muốn thay đổi địa chỉ nhận hàng">Tôi muốn thay đổi địa chỉ nhận hàng</option>
              <option value="Tôi muốn thay đổi phương thức thanh toán">Tôi muốn thay đổi phương thức thanh toán</option>
              <option value="other">Lý do khác...</option>
            </select>
          </div>

          {/* Ô viết lý do khác */}
          {cancelReason === "other" && (
            <div className="space-y-1.5 animate-in fade-in duration-300">
              <label className="text-[11px] font-semibold text-[#2b2b2b] tracking-wider uppercase">
                Chi tiết lý do khác
              </label>
              <textarea
                placeholder="Quý khách vui lòng nhập lý do cụ thể..."
                required
                disabled={cancelLoading}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm text-[#2b2b2b] placeholder-gray-400 focus:outline-none focus:border-[#2e4c7e] focus:ring-1 focus:ring-[#2e4c7e] transition-all resize-none"
              />
            </div>
          )}

          {/* Báo lỗi */}
          {cancelError && (
            <div className="p-3 bg-red-50 border-l-2 border-red-500 rounded-lg text-xs text-red-600 leading-normal animate-in fade-in duration-200">
              {cancelError}
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              disabled={cancelLoading}
              onClick={onClose}
              className="px-5 py-2.5 border border-[#e2e8f0] hover:border-gray-400 text-[#777] hover:text-[#333] text-xs font-semibold rounded-full transition-all cursor-pointer bg-transparent"
            >
              Quay lại
            </button>
            
            <button
              type="submit"
              disabled={cancelLoading}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-semibold rounded-full tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-red-600/10 active:scale-[0.98]"
            >
              {cancelLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Xác Nhận Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

