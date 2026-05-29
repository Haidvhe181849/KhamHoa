"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";
import { 
  TrendingUp, Users, Package, DollarSign, Calendar, 
  ArrowUpRight, ShoppingBag, Eye, RefreshCw, Loader2, Sparkles, CheckCircle2 
} from "lucide-react";

interface KPIData {
  todayRevenue: number;
  monthRevenue: number;
  totalCustomers: number;
  totalProducts: number;
}

interface ProductData {
  _id: string;
  name: string;
  price: number;
  stock: number;
  sold: number;
  images: { url: string; publicId?: string }[];
}

interface OrderData {
  _id: string;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

interface ChartItem {
  _id: string;
  revenue: number;
}

interface StatsData {
  kpi: KPIData;
  recentOrders: OrderData[];
  topProducts: ProductData[];
  statusDistribution: Record<string, number>;
  dailyRevenue: ChartItem[];
  monthlyRevenue: ChartItem[];
}

interface BarChartItem {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  rawLabel: string;
  val: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Active chart hover tooltips states
  const [hoveredDailyIndex, setHoveredDailyIndex] = useState<number | null>(null);
  const [hoveredMonthlyIndex, setHoveredMonthlyIndex] = useState<number | null>(null);

  const loadStats = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/orders/admin/stats`);
      const resData = await res.json();

      if (res.ok && resData.success && resData.data) {
        setStats(resData.data);
      } else {
        setError(resData.message || "Không thể tải dữ liệu thống kê.");
      }
    } catch (error) {
      console.error("Lỗi lấy dữ liệu dashboard:", error);
      setError("Lỗi kết nối máy chủ thống kê.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const mapping: Record<string, { label: string; style: string }> = {
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

  const getPaymentBadge = (status: string) => {
    const mapping: Record<string, { label: string; style: string }> = {
      PENDING: { label: "Chưa thanh toán", style: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
      PAID: { label: "Đã thanh toán", style: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
      FAILED: { label: "Thanh toán lỗi", style: "bg-rose-500/10 text-rose-400 border border-rose-500/20" }
    };
    const mapped = mapping[status] || { label: status, style: "bg-gray-500/10 text-gray-400 border border-gray-500/20" };
    return (
      <span className={`px-2 py-0.5 text-[9px] font-semibold rounded ${mapped.style}`}>
        {mapped.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-[#c9a15c] animate-spin" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Đang kết xuất báo cáo thống kê...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-[#1C1816] border border-red-500/20 p-8 rounded-2xl text-center space-y-4">
        <h3 className="text-lg font-serif font-bold text-red-400">Không thể tải dữ liệu phân tích</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">{error || "Hệ thống gặp sự cố tải cơ sở dữ liệu."}</p>
        <button
          onClick={() => loadStats()}
          className="px-6 py-2.5 bg-[#c9a15c] hover:bg-[#b88f4b] text-[#14110F] text-xs font-bold rounded-full transition-all cursor-pointer shadow-lg"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  const { kpi, recentOrders, topProducts, statusDistribution, dailyRevenue, monthlyRevenue } = stats;

  // 1. Calculate Doughnut Chart Coordinates
  const totalOrders = Object.values(statusDistribution).reduce((a, b) => a + b, 0);
  const getDoughnutSlices = () => {
    let accumulatedPercentage = 0;
    const colors = {
      PENDING: "#f59e0b",
      CONFIRMED: "#3b82f6",
      SHIPPING: "#a855f7",
      DELIVERED: "#10b981",
      CANCELLED: "#ef4444"
    };

    return Object.entries(statusDistribution).map(([status, count]) => {
      const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
      const startAngle = (accumulatedPercentage * 360) / 100;
      accumulatedPercentage += percentage;
      const endAngle = (accumulatedPercentage * 360) / 100;

      // Convert angles to polar coordinates
      const rad = Math.PI / 180;
      const x1 = 50 + 40 * Math.cos((startAngle - 90) * rad);
      const y1 = 50 + 40 * Math.sin((startAngle - 90) * rad);
      const x2 = 50 + 40 * Math.cos((endAngle - 90) * rad);
      const y2 = 50 + 40 * Math.sin((endAngle - 90) * rad);

      const largeArc = percentage > 50 ? 1 : 0;

      return {
        status,
        count,
        percentage: percentage.toFixed(1),
        color: colors[status as keyof typeof colors] || "#6b7280",
        pathData: percentage === 100 
          ? `M 50 10 A 40 40 0 1 1 49.99 10 Z` 
          : percentage === 0 
          ? "" 
          : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`
      };
    }).filter(s => s.count > 0);
  };

  // 2. Build Daily SVG Area Chart Points
  const getDailyChartPoints = () => {
    const paddingX = 40;
    const paddingY = 30;
    const width = 500;
    const height = 180;

    if (dailyRevenue.length === 0) {
      return { linePath: "", areaPath: "", xCoords: [] as number[], yCoords: [] as number[], maxVal: 1000000, width, height, paddingX, paddingY };
    }

    const maxVal = Math.max(...dailyRevenue.map(d => d.revenue), 1000000);

    const xCoords = dailyRevenue.map((_, idx) => 
      paddingX + (idx / Math.max(dailyRevenue.length - 1, 1)) * (width - paddingX * 2)
    );
    const yCoords = dailyRevenue.map(d => 
      height - paddingY - (d.revenue / maxVal) * (height - paddingY * 2)
    );

    const linePath = dailyRevenue.reduce((acc, _, idx) => 
      acc + (idx === 0 ? `M ${xCoords[idx]} ${yCoords[idx]}` : ` L ${xCoords[idx]} ${yCoords[idx]}`), 
      ""
    );

    const areaPath = dailyRevenue.length > 0
      ? `${linePath} L ${xCoords[xCoords.length - 1]} ${height - paddingY} L ${xCoords[0]} ${height - paddingY} Z`
      : "";

    return { linePath, areaPath, xCoords, yCoords, maxVal, width, height, paddingX, paddingY };
  };

  // 3. Build Monthly SVG Bar Columns
  const getMonthlyChartBars = () => {
    const width = 500;
    const height = 180;
    const paddingX = 40;
    const paddingY = 30;

    if (monthlyRevenue.length === 0) {
      return { bars: [] as BarChartItem[], maxVal: 5000000, width, height, paddingX, paddingY };
    }

    const maxVal = Math.max(...monthlyRevenue.map(m => m.revenue), 5000000);
    const barAreaWidth = width - paddingX * 2;
    const barWidth = Math.max(8, (barAreaWidth / monthlyRevenue.length) * 0.5);
    const step = barAreaWidth / Math.max(monthlyRevenue.length, 1);

    const bars = monthlyRevenue.map((m, idx) => {
      const x = paddingX + idx * step + (step - barWidth) / 2;
      const barHeight = (m.revenue / maxVal) * (height - paddingY * 2);
      const y = height - paddingY - barHeight;

      return {
        x,
        y,
        w: barWidth,
        h: Math.max(barHeight, 2),
        label: m._id.slice(5), // Month label (MM)
        rawLabel: m._id,
        val: m.revenue
      };
    });

    return { bars, maxVal, width, height, paddingX, paddingY };
  };

  const dailyPoints = getDailyChartPoints();
  const monthlyPoints = getMonthlyChartBars();
  const doughnutSlices = getDoughnutSlices();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-white font-semibold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#c9a15c]" /> TỔNG QUAN PHÂN TÍCH
          </h2>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-[0.2em] font-medium">
            Hiệu năng bán hàng thực tế & Số liệu tăng trưởng
          </p>
        </div>
        <button
          onClick={() => loadStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-[#c9a15c] border border-white/[0.08] hover:border-[#c9a15c] text-gray-300 hover:text-[#14110F] text-xs font-bold rounded-full transition-all cursor-pointer shadow-md active:scale-[0.98]"
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Làm mới số liệu
        </button>
      </div>

      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Doanh thu hôm nay */}
        <div className="relative group overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-[#c9a15c]/30 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#c9a15c]/10 to-transparent rounded-bl-full pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-60" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doanh thu hôm nay</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-serif font-black tracking-wide text-white mt-4">
            {formatPrice(kpi.todayRevenue)}
          </h3>
          <p className="text-[10px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Doanh số thực nhận DELIVERED
          </p>
        </div>

        {/* KPI 2: Doanh thu tháng này */}
        <div className="relative group overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-[#c9a15c]/30 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#c9a15c]/10 to-transparent rounded-bl-full pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-60" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doanh thu tháng này</span>
            <div className="w-10 h-10 rounded-xl bg-[#c9a15c]/10 flex items-center justify-center text-[#c9a15c] border border-[#c9a15c]/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-serif font-black tracking-wide text-white mt-4">
            {formatPrice(kpi.monthRevenue)}
          </h3>
          <p className="text-[10px] text-[#c9a15c] mt-2 font-semibold tracking-wider uppercase flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Tháng {new Date().getMonth() + 1}
          </p>
        </div>

        {/* KPI 3: Tổng khách hàng */}
        <div className="relative group overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-[#c9a15c]/30 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#c9a15c]/10 to-transparent rounded-bl-full pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-60" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng khách hàng</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-serif font-black tracking-wide text-white mt-4">
            {kpi.totalCustomers.toLocaleString()}
          </h3>
          <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">
            Tài khoản mua sắm đăng ký
          </p>
        </div>

        {/* KPI 4: Tổng sản phẩm */}
        <div className="relative group overflow-hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-[#c9a15c]/30 backdrop-blur-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#c9a15c]/10 to-transparent rounded-bl-full pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-60" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng mặt hàng</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-xl md:text-2xl font-serif font-black tracking-wide text-white mt-4">
            {kpi.totalProducts.toLocaleString()}
          </h3>
          <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">
            Sản phẩm lưu thông hệ thống
          </p>
        </div>

      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Daily Revenue Area Chart (3/5 columns) */}
        <div className="lg:col-span-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-2xl flex flex-col justify-between backdrop-blur-md min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Biểu đồ doanh thu 30 ngày qua</h4>
              <p className="text-[10px] text-gray-400">Xu hướng biến động doanh thu hàng ngày</p>
            </div>
            {hoveredDailyIndex !== null && dailyRevenue[hoveredDailyIndex] && (
              <div className="bg-[#1C1816] px-3 py-1.5 rounded-lg border border-[#c9a15c]/30 text-right animate-in fade-in zoom-in-95 duration-200">
                <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold">{dailyRevenue[hoveredDailyIndex]._id}</span>
                <span className="text-xs font-black text-[#c9a15c]">{formatPrice(dailyRevenue[hoveredDailyIndex].revenue)}</span>
              </div>
            )}
          </div>

          {dailyRevenue.length > 0 && dailyPoints ? (
            <div className="flex-1 w-full flex items-center justify-center">
              <svg 
                viewBox={`0 0 ${dailyPoints.width} ${dailyPoints.height}`}
                className="w-full h-full max-h-[200px]"
              >
                <defs>
                  {/* Luxury gold area gradient */}
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c9a15c" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#c9a15c" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                  const y = dailyPoints.paddingY + p * (dailyPoints.height - dailyPoints.paddingY * 2);
                  return (
                    <line 
                      key={idx}
                      x1={dailyPoints.paddingX}
                      y1={y}
                      x2={dailyPoints.width - dailyPoints.paddingX}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.04)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Shaded Area */}
                <path d={dailyPoints.areaPath} fill="url(#areaGrad)" />

                {/* Line Path */}
                <path 
                  d={dailyPoints.linePath} 
                  fill="none" 
                  stroke="#c9a15c" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Hover dots interaction grids */}
                {dailyRevenue.map((d, idx) => {
                  const cx = dailyPoints.xCoords[idx];
                  const cy = dailyPoints.yCoords[idx];
                  const isHovered = hoveredDailyIndex === idx;

                  return (
                    <g key={idx} className="cursor-pointer">
                      {/* Interactive hover column */}
                      <rect
                        x={cx - 8}
                        y={dailyPoints.paddingY}
                        width="16"
                        height={dailyPoints.height - dailyPoints.paddingY * 2}
                        fill="transparent"
                        onMouseEnter={() => setHoveredDailyIndex(idx)}
                        onMouseLeave={() => setHoveredDailyIndex(null)}
                      />
                      {/* Active gold dot */}
                      {isHovered && (
                        <circle 
                          cx={cx}
                          cy={cy}
                          r="5"
                          fill="#c9a15c"
                          stroke="white"
                          strokeWidth="1.5"
                          className="transition-all duration-200"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500 italic">
              Chưa ghi nhận doanh thu phát sinh trong 30 ngày qua
            </div>
          )}
        </div>

        {/* Order Status Doughnut Chart (2/5 columns) */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-2xl flex flex-col justify-between backdrop-blur-md min-h-[300px]">
          <div className="space-y-1 mb-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Phân bổ trạng thái đơn hàng</h4>
            <p className="text-[10px] text-gray-400">Tỷ lệ cơ cấu giỏ hàng toàn hệ thống</p>
          </div>

          {totalOrders > 0 ? (
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 justify-center">
              {/* Dynamic SVG donut */}
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {doughnutSlices.map((slice, idx) => (
                    <path
                      key={idx}
                      d={slice.pathData}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="12"
                      className="transition-all duration-500 hover:opacity-90"
                    />
                  ))}
                  {/* Central Obsidian dark core */}
                  <circle cx="50" cy="50" r="32" fill="#1C1816" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng đơn</span>
                  <span className="text-lg font-extrabold text-white font-serif mt-0.5">{totalOrders}</span>
                </div>
              </div>

              {/* Legend with counts */}
              <div className="flex-1 space-y-2.5 w-full text-xs">
                {doughnutSlices.map((slice, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: slice.color }} />
                      <span className="text-gray-300 font-semibold uppercase text-[9px] tracking-wider">{getStatusBadge(slice.status)}</span>
                    </div>
                    <span className="font-bold text-white tracking-wide">
                      {slice.count} <span className="text-[10px] text-gray-500 font-medium">({slice.percentage}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500 italic">
              Chưa ghi nhận dữ liệu đơn hàng trong hệ thống
            </div>
          )}
        </div>

      </div>

      {/* Monthly Bar Chart & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Monthly Revenue Chart (3/5 columns) */}
        <div className="lg:col-span-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-2xl flex flex-col justify-between backdrop-blur-md min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Doanh thu theo tháng trong năm</h4>
              <p className="text-[10px] text-gray-400">Doanh số kiểm kê theo từng tháng tài khóa</p>
            </div>
            {hoveredMonthlyIndex !== null && monthlyRevenue[hoveredMonthlyIndex] && (
              <div className="bg-[#1C1816] px-3 py-1.5 rounded-lg border border-[#c9a15c]/30 text-right animate-in fade-in zoom-in-95 duration-200">
                <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold">Tháng {monthlyRevenue[hoveredMonthlyIndex]._id}</span>
                <span className="text-xs font-black text-[#c9a15c]">{formatPrice(monthlyRevenue[hoveredMonthlyIndex].revenue)}</span>
              </div>
            )}
          </div>

          {monthlyRevenue.length > 0 && monthlyPoints.bars.length > 0 ? (
            <div className="flex-1 w-full flex items-center justify-center">
              <svg 
                viewBox={`0 0 ${monthlyPoints.width} ${monthlyPoints.height}`}
                className="w-full h-full max-h-[200px]"
              >
                {/* Horizontal Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                  const y = monthlyPoints.paddingY + p * (monthlyPoints.height - monthlyPoints.paddingY * 2);
                  return (
                    <line 
                      key={idx}
                      x1={monthlyPoints.paddingX}
                      y1={y}
                      x2={monthlyPoints.width - monthlyPoints.paddingX}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.04)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Monthly Bars */}
                {monthlyPoints.bars.map((bar, idx) => {
                  const isHovered = hoveredMonthlyIndex === idx;

                  return (
                    <g key={idx}>
                      {/* Bar Column */}
                      <rect
                        x={bar.x}
                        y={bar.y}
                        width={bar.w}
                        height={bar.h}
                        fill={isHovered ? "#dfb877" : "#c9a15c"}
                        rx="2"
                        className="transition-all duration-300"
                      />
                      {/* Label Text */}
                      <text
                        x={bar.x + bar.w / 2}
                        y={monthlyPoints.height - 10}
                        textAnchor="middle"
                        fill="gray"
                        fontSize="9"
                        fontWeight="semibold"
                      >
                        {bar.label}
                      </text>
                      {/* Hover Trigger overlay */}
                      <rect
                        x={bar.x - 10}
                        y={monthlyPoints.paddingY}
                        width={bar.w + 20}
                        height={monthlyPoints.height - monthlyPoints.paddingY * 2}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredMonthlyIndex(idx)}
                        onMouseLeave={() => setHoveredMonthlyIndex(null)}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-500 italic">
              Chưa ghi nhận kết quả doanh số theo tháng trong năm nay
            </div>
          )}
        </div>

        {/* Top Selling Products List (2/5 columns) */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-2xl flex flex-col justify-between backdrop-blur-md min-h-[300px]">
          <div className="space-y-1 mb-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Top 5 sản phẩm bán chạy</h4>
            <p className="text-[10px] text-gray-400">Các mặt hàng có doanh số bán ra dẫn đầu</p>
          </div>

          <div className="flex-1 divide-y divide-white/[0.06] overflow-y-auto scrollbar-thin">
            {topProducts.length > 0 ? (
              topProducts.map((prod, idx) => (
                <div key={prod._id} className="py-3 flex gap-3 items-center group hover:bg-white/[0.01] transition-colors">
                  <div className="w-5 h-5 rounded-md bg-[#c9a15c]/10 text-[#c9a15c] flex items-center justify-center text-[10px] font-black shrink-0 border border-[#c9a15c]/25">
                    {idx + 1}
                  </div>
                  <div className="w-10 h-10 rounded-lg border border-white/[0.08] overflow-hidden shrink-0 bg-[#1C1816] relative">
                    {prod.images?.[0]?.url ? (
                      <Image src={prod.images[0].url} alt={prod.name} fill sizes="40px" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5 text-[8px] text-gray-500 font-bold uppercase">No Pic</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-white truncate group-hover:text-[#c9a15c] transition-colors">
                      {prod.name}
                    </h5>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 mt-0.5">
                      <span>Đã bán: <span className="font-extrabold text-white">{prod.sold}</span></span>
                      <span className="font-bold text-[#c9a15c]">{formatPrice(prod.price)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
                Chưa có dữ liệu bán hàng.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RECENT ORDERS TABLE (Full Width) */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4.5 h-4.5 text-[#c9a15c]" /> 5 đơn đặt hàng mới nhất
            </h4>
            <p className="text-[10px] text-gray-400">Các giao dịch đặt hàng vừa phát sinh trong thời gian qua</p>
          </div>
          <Link 
            href="/admin/order"
            className="flex items-center gap-1 text-[10px] font-bold text-[#c9a15c] hover:text-[#e8d8c3] tracking-widest uppercase border border-[#c9a15c]/20 hover:border-[#c9a15c]/50 rounded-full px-4 py-1.5 transition-all cursor-pointer shadow-lg active:scale-[0.98]"
          >
            Tất cả đơn hàng <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1C1816] text-[#c9a15c] uppercase font-bold tracking-widest text-[9px] border-b border-white/[0.06]">
                <th className="px-5 py-4">Mã Đơn</th>
                <th className="px-5 py-4">Khách Hàng</th>
                <th className="px-5 py-4">Ngày Đặt</th>
                <th className="px-5 py-4">Tổng Tiền</th>
                <th className="px-5 py-4">Trạng Thái Đơn</th>
                <th className="px-5 py-4">Trạng Thái Thanh Toán</th>
                <th className="px-5 py-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] bg-[#161311]/40">
              {recentOrders.length > 0 ? (
                recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-white select-all">{ord.orderCode}</td>
                    <td className="px-5 py-4 font-semibold text-white">{ord.customerName}</td>
                    <td className="px-5 py-4 text-gray-400 font-medium">
                      {new Date(ord.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-5 py-4 font-bold text-[#c9a15c]">{formatPrice(ord.totalAmount)}</td>
                    <td className="px-5 py-4">{getStatusBadge(ord.orderStatus)}</td>
                    <td className="px-5 py-4">{getPaymentBadge(ord.paymentStatus)}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/order?code=${ord.orderCode}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-white/[0.04] hover:bg-[#c9a15c] hover:text-[#14110F] border border-white/[0.06] hover:border-[#c9a15c] rounded-full px-3.5 py-1.5 transition-all shadow-md"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500 italic">
                    Chưa ghi nhận dữ liệu đơn đặt hàng nào trong hệ thống.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
