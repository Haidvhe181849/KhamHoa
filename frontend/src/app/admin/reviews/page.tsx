"use client";

import React, { useState, useEffect } from "react";
import { API_BASE_URL, fetchWithAuth } from "@/lib/api";
import { 
  Star, MessageSquare, EyeOff, Search, Filter, 
  CheckCircle2, XCircle, Loader2, Image as ImageIcon,
  RotateCw, RefreshCw
} from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import { useConfirm } from "@/components/ui/ConfirmContext";

interface ReviewData {
  _id: string;
  userId: { _id: string; name: string; avatar: string };
  productId: { _id: string; name: string; images: { url: string }[] };
  rating: number;
  comment: string;
  images: { url: string }[];
  replyComment: string | null;
  isReplied: boolean;
  isHidden: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [stats, setStats] = useState({ totalReviews: 0, repliedReviews: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStars, setFilterStars] = useState("");
  const [filterReplied, setFilterReplied] = useState("");
  const [filterHidden, setFilterHidden] = useState("");

  // Modal
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewData | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const toast = useToast();
  const { confirm } = useConfirm();

  const fetchReviews = async (p = page) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: p.toString(),
        limit: "10"
      });
      if (filterStars) queryParams.append("stars", filterStars);
      if (filterReplied) queryParams.append("isReplied", filterReplied);
      if (filterHidden) queryParams.append("isHidden", filterHidden);

      const res = await fetchWithAuth(`${API_BASE_URL}/api/reviews/admin?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.data);
        setStats(data.stats);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, filterStars, filterReplied, filterHidden]);

  const handleReplySubmit = async () => {
    if (!selectedReview || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/reviews/admin/${selectedReview._id}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyComment: replyText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Đã gửi phản hồi thành công");
        setReviews(reviews.map(r => r._id === selectedReview._id ? data.data : r));
        setReplyModalOpen(false);
        fetchReviews(); // Refresh stats
      } else {
        toast.error(data.message || "Lỗi khi phản hồi.");
      }
    } catch (err) {
      toast.error("Kết nối máy chủ thất bại.");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleToggleVisibility = (id: string) => {
    confirm({
      title: "Cập nhật hiển thị",
      message: "Bạn có chắc chắn muốn thay đổi trạng thái hiển thị của đánh giá này?",
      variant: "warning",
      onConfirm: async () => {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/api/reviews/admin/${id}/toggle-visibility`, {
            method: "PATCH"
          });
          const data = await res.json();
          if (res.ok && data.success) {
            toast.success("Cập nhật trạng thái hiển thị thành công");
            setReviews(reviews.map(r => r._id === id ? data.data : r));
          } else {
            toast.error(data.message);
          }
        } catch (err) {
          toast.error("Lỗi kết nối.");
        }
      }
    });
  };

  const openReplyModal = (review: ReviewData) => {
    setSelectedReview(review);
    setReplyText(review.replyComment || "");
    setReplyModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-white font-semibold">
            QUẢN LÝ ĐÁNH GIÁ
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-[0.2em] font-medium">
            Lắng nghe, phản hồi và kiểm duyệt trải nghiệm của khách hàng
          </p>
        </div>
        <button
          onClick={() => fetchReviews(1)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-[#c9a15c] border border-white/[0.08] hover:border-[#c9a15c] text-gray-300 hover:text-[#14110F] text-xs font-bold rounded-full transition-all cursor-pointer shadow-md"
        >
          <RotateCw className="w-3.5 h-3.5" /> Đồng bộ danh sách
        </button>
      </div>

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] backdrop-blur-md shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Điểm trung bình</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.avgRating} <span className="text-sm text-gray-500 font-medium">/ 5.0</span></p>
          </div>
        </div>
        <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] backdrop-blur-md shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Tổng số đánh giá</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalReviews}</p>
          </div>
        </div>
        <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.06] backdrop-blur-md shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Tỷ lệ đã phản hồi</p>
            <p className="text-2xl font-bold text-white mt-1">
              {stats.totalReviews > 0 ? Math.round((stats.repliedReviews / stats.totalReviews) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="flex items-center gap-2 pl-2 md:col-span-1">
            <Filter className="w-4 h-4 text-[#c9a15c]" />
            <span className="text-sm font-semibold text-white uppercase tracking-wider">Bộ lọc:</span>
          </div>
          
          <select 
            className="w-full px-3.5 py-2.5 bg-[#1C1816] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all cursor-pointer font-semibold"
            value={filterStars}
            onChange={(e) => setFilterStars(e.target.value)}
          >
            <option value="">Tất cả số sao</option>
            <option value="5">5 Sao</option>
            <option value="4">4 Sao</option>
            <option value="3">3 Sao</option>
            <option value="2">2 Sao</option>
            <option value="1">1 Sao</option>
          </select>

          <select 
            className="w-full px-3.5 py-2.5 bg-[#1C1816] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all cursor-pointer font-semibold"
            value={filterReplied}
            onChange={(e) => setFilterReplied(e.target.value)}
          >
            <option value="">Trạng thái phản hồi</option>
            <option value="false">Chưa phản hồi</option>
            <option value="true">Đã phản hồi</option>
          </select>

          <div className="flex gap-2">
            <select 
              className="flex-1 px-3.5 py-2.5 bg-[#1C1816] border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all cursor-pointer font-semibold"
              value={filterHidden}
              onChange={(e) => setFilterHidden(e.target.value)}
            >
              <option value="">Trạng thái hiển thị</option>
              <option value="false">Đang hiển thị</option>
              <option value="true">Đã ẩn</option>
            </select>
            <button
              onClick={() => { setFilterStars(""); setFilterReplied(""); setFilterHidden(""); }}
              className="p-2.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-[#c9a15c] animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 text-gray-500 font-medium">
            Không tìm thấy đánh giá nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1C1816] text-[#c9a15c] uppercase font-bold tracking-widest text-[9px] border-b border-white/[0.06]">
                  <th className="px-5 py-4">Khách hàng</th>
                  <th className="px-5 py-4">Sản phẩm</th>
                  <th className="px-5 py-4">Nội dung đánh giá</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] bg-[#161311]/40">
                {reviews.map((review) => (
                  <tr key={review._id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={review.userId?.avatar} alt={review.userId?.name} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                        <div>
                          <p className="font-bold text-white group-hover:text-[#c9a15c] transition-colors">{review.userId?.name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {review.productId?.images?.[0] ? (
                           <img src={review.productId.images[0].url} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="" />
                        ) : (
                           <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-500" /></div>
                        )}
                        <span className="text-gray-300 font-semibold line-clamp-2 max-w-[150px]">
                          {review.productId?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="flex mb-1.5 text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-current" : "text-gray-600"}`} />
                        ))}
                      </div>
                      <p className="text-gray-300 font-medium line-clamp-2 leading-relaxed">{review.comment}</p>
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {review.images.map((img, i) => (
                            <img key={i} src={img.url} className="w-8 h-8 rounded border border-white/10 object-cover" alt="" />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 space-y-1.5">
                      <div>
                        {review.isReplied ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider w-max">
                            <CheckCircle2 className="w-3 h-3" /> Đã phản hồi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 uppercase tracking-wider w-max">
                            <MessageSquare className="w-3 h-3" /> Chờ phản hồi
                          </span>
                        )}
                      </div>
                      
                      {review.isHidden && (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase tracking-wider w-max">
                            <EyeOff className="w-3 h-3" /> Đã ẩn
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openReplyModal(review)}
                          className="px-3 py-1.5 text-xs font-bold text-[#c9a15c] bg-[#c9a15c]/10 border border-[#c9a15c]/20 hover:bg-[#c9a15c] hover:text-[#14110F] rounded-lg transition-colors"
                        >
                          {review.isReplied ? "Sửa" : "Phản hồi"}
                        </button>
                        <button 
                          onClick={() => handleToggleVisibility(review._id)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                            review.isHidden 
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500 hover:text-white" 
                              : "text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500 hover:text-white"
                          }`}
                        >
                          {review.isHidden ? "Hiện" : "Ẩn"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-xs font-bold text-white transition-all disabled:opacity-50 disabled:hover:bg-white/[0.02]"
          >
            Trước
          </button>
          <span className="text-xs font-bold text-gray-400 px-2">
            Trang <span className="text-[#c9a15c]">{page}</span> / {totalPages}
          </span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-xs font-bold text-white transition-all disabled:opacity-50 disabled:hover:bg-white/[0.02]"
          >
            Sau
          </button>
        </div>
      )}

      {/* REPLY MODAL */}
      {replyModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1C1816] rounded-2xl shadow-2xl border border-white/[0.1] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center bg-black/20">
              <h3 className="text-lg font-serif font-bold text-white tracking-wide">PHẢN HỒI ĐÁNH GIÁ</h3>
              <button onClick={() => setReplyModalOpen(false)} className="text-gray-500 hover:text-rose-400 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Customer Review Info */}
              <div className="bg-white/[0.02] p-4 rounded-xl border border-white/[0.04]">
                <div className="flex gap-1 mb-2 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < selectedReview.rating ? "fill-current" : "text-gray-600"}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-300 italic mb-3">"{selectedReview.comment}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    <img src={selectedReview.userId?.avatar} className="w-full h-full object-cover" alt="" />
                  </div>
                  <p className="text-xs text-gray-400 font-semibold">{selectedReview.userId?.name}</p>
                </div>
              </div>

              {/* Reply Input */}
              <div>
                <label className="block text-xs font-bold text-[#c9a15c] mb-2 uppercase tracking-wider">
                  Câu trả lời của Shop (hiển thị công khai)
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-black/20 border border-white/[0.08] rounded-xl p-3 text-sm text-white placeholder-gray-600 outline-none focus:border-[#c9a15c] focus:ring-1 focus:ring-[#c9a15c] transition-all"
                  placeholder="Nhập phản hồi của bạn để khách hàng thấy được sự quan tâm của Khảm Hoa..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 pt-0 flex justify-end gap-3">
              <button 
                onClick={() => setReplyModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleReplySubmit}
                disabled={replyLoading || !replyText.trim()}
                className="px-6 py-2 text-xs font-bold text-[#14110F] bg-gradient-to-r from-[#c9a15c] to-[#e8d8c3] hover:brightness-110 rounded-xl transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-2 shadow-lg shadow-[#c9a15c]/20"
              >
                {replyLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#14110F]" /> : null}
                {selectedReview.isReplied ? "Cập nhật phản hồi" : "Gửi phản hồi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
