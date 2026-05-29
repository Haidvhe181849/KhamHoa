"use client";

import React, { useState } from "react";
import { X, Star, Upload, Loader2 } from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";
import { useToast } from "@/components/ui/ToastContext";

interface ReviewModalProps {
  orderId: string;
  productId: string;
  productName: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function ReviewModal({ orderId, productId, productName, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const nextFiles = [...selectedFiles, ...files].slice(0, 5);
      setSelectedFiles(nextFiles);
      setPreviewUrls(nextFiles.map(f => URL.createObjectURL(f)));
    }
  };

  const removeFile = (idx: number) => {
    const next = [...selectedFiles];
    next.splice(idx, 1);
    setSelectedFiles(next);
    setPreviewUrls(next.map(f => URL.createObjectURL(f)));
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Vui lòng nhập bình luận.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("orderId", orderId);
      formData.append("rating", rating.toString());
      formData.append("comment", comment.trim());
      
      selectedFiles.forEach(file => {
        formData.append("images", file);
      });

      const res = await fetchWithAuth(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Cảm ơn bạn đã gửi đánh giá!");
        await onSuccess();
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      toast.error("Lỗi kết nối.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#FAF8F6] px-6 py-4 border-b border-[#F1EEE8] flex justify-between items-center shrink-0">
          <h3 className="text-base font-serif font-bold text-[#2b2b2b] tracking-wide">
            Đánh giá sản phẩm
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submitReview} className="p-6 overflow-y-auto space-y-5">
          <div>
            <p className="text-sm font-semibold text-[#333] mb-1">{productName}</p>
            <p className="text-xs text-gray-500">Hãy chia sẻ trải nghiệm của bạn về sản phẩm này.</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#555] mb-2 uppercase tracking-wide">Chất lượng sản phẩm</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(num => (
                <button 
                  key={num} 
                  type="button" 
                  onClick={() => setRating(num)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`w-8 h-8 ${rating >= num ? "fill-[#f5a623] text-[#f5a623]" : "text-gray-200"}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#555] mb-2 uppercase tracking-wide">Nhận xét của bạn *</p>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Sản phẩm rất đẹp, đóng gói cẩn thận..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#2e4c7e] resize-none text-sm text-[#333]"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-[#555] mb-2 uppercase tracking-wide">Hình ảnh thực tế (Tối đa 5 ảnh)</p>
            <div className="flex gap-3 items-center flex-wrap">
              <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-[#2e4c7e]/30 text-[#2e4c7e] hover:bg-[#2e4c7e]/5 rounded-xl cursor-pointer transition-colors">
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-semibold">Tải ảnh</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden group">
                  <img src={url} alt="preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full py-3 bg-[#2e4c7e] text-white text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-[#1b2a4a] transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 shadow-md"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Gửi Đánh Giá
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
