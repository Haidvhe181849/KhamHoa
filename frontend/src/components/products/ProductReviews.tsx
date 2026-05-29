import React, { useState, useEffect } from "react";
import { Star, Upload, X, Loader2, MessageSquare, ChevronDown, CheckCircle2 } from "lucide-react";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/ToastContext";

interface Review {
  _id: string;
  userId: {
    name?: string;
    fullName?: string;
    avatar: string;
  };
  rating: number;
  comment: string;
  images: Array<{ url: string; publicId: string }>;
  replyComment?: string;
  isReplied?: boolean;
  createdAt: string;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { isAuthenticated } = useAuth();
  const toast = useToast();

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkEligibility();
  }, [productId, page]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/product/${productId}?page=${page}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        
        // Compute average locally or get from product
        if (data.data.length > 0) {
          const avg = data.data.reduce((acc: number, curr: Review) => acc + curr.rating, 0) / data.data.length;
          setAverage(avg);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      // Check local storage for token first
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetchWithAuth(`${API_BASE_URL}/api/reviews/eligibility/${productId}`);
      const data = await res.json();
      if (data.success && data.eligible) {
        setEligible(true);
        setOrderId(data.orderId);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
      if (orderId) formData.append("orderId", orderId);
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
        setShowForm(false);
        setEligible(false);
        fetchReviews();
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
    <div className="mt-16 border-t border-[#e2e8f0] pt-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl md:text-2xl font-serif text-[#333]">Đánh giá từ khách hàng</h2>
        {eligible && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-[#2e4c7e] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#1b2a4a] transition-colors"
          >
            Viết đánh giá
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submitReview} className="bg-[#faf8f6] p-6 rounded-2xl border border-[#e2e8f0] mb-8 space-y-5 animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-4">
            <h3 className="font-bold text-[#2e4c7e]">Đánh giá sản phẩm này</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5"/></button>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-[#555] mb-2 uppercase tracking-wide">Chất lượng sản phẩm</p>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(num => (
                <button 
                  key={num} 
                  type="button" 
                  onClick={() => setRating(num)}
                  className="transition-transform hover:scale-110"
                >
                  <Star className={`w-8 h-8 ${rating >= num ? "fill-[#f5a623] text-[#f5a623]" : "text-gray-300"}`} />
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
              placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này nhé..."
              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] focus:outline-none focus:border-[#2e4c7e] resize-none text-sm text-[#333]"
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
                <div key={idx} className="relative w-20 h-20 rounded-xl border border-[#e2e8f0] overflow-hidden group">
                  <img src={url} alt="preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={submitting}
              className="px-6 py-2.5 bg-[#2e4c7e] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#1b2a4a] transition-colors flex items-center gap-2 disabled:bg-gray-400"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Gửi Đánh Giá
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#2e4c7e]"/></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 bg-[#faf8f6] rounded-2xl border border-[#e2e8f0]">
          <p className="text-[#777] text-sm">Chưa có đánh giá nào cho sản phẩm này.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review._id} className="border-b border-[#e2e8f0] pb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#e2e8f0] overflow-hidden flex-shrink-0">
                  {review.userId?.avatar ? (
                    <img src={review.userId.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#2e4c7e] text-white font-bold uppercase">
                      {(review.userId?.name || review.userId?.fullName || "U").charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-[#333] text-sm">{review.userId?.name || review.userId?.fullName || "Khách hàng"}</h4>
                    <span className="text-[10px] text-[#999]">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {[1,2,3,4,5].map(num => (
                      <Star key={num} className={`w-3.5 h-3.5 ${review.rating >= num ? "fill-[#f5a623] text-[#f5a623]" : "text-gray-200"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-[#555] leading-relaxed mb-3">{review.comment}</p>
                  
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.images.map((img, i) => (
                        <div key={i} className="w-16 h-16 rounded-lg border border-[#e2e8f0] overflow-hidden cursor-pointer hover:border-[#2e4c7e] transition-colors">
                          <img src={img.url} alt="review pic" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Phần phản hồi của Shop */}
                  {review.isReplied && review.replyComment && (
                    <div className="mt-4 bg-[#faf8f6] border-l-2 border-[#d8a39d] p-4 rounded-r-xl">
                      <p className="text-xs font-bold text-[#d8a39d] uppercase mb-1 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#d8a39d] text-white flex items-center justify-center text-[8px] font-serif">K</span>
                        Khảm Hoa Store Phản Hồi
                      </p>
                      <p className="text-sm text-[#555] leading-relaxed">
                        {review.replyComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button disabled={page === 1} onClick={() => setPage(page-1)} className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-xs font-semibold disabled:opacity-50">Trước</button>
              <span className="px-3 py-1.5 text-xs font-semibold text-[#2e4c7e]">Trang {page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(page+1)} className="px-3 py-1.5 border border-[#e2e8f0] rounded-lg text-xs font-semibold disabled:opacity-50">Sau</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
