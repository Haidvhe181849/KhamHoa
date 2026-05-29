import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chỉ can thiệp bảo vệ các định tuyến quản trị /admin/*
  if (pathname.startsWith("/admin")) {
    const accessToken = request.cookies.get("accessToken")?.value;

    // 1. Chặn ngay lập tức nếu hoàn toàn không có Cookie accessToken
    if (!accessToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // 2. Xác minh chữ ký JWT Offline tại tầng Edge của Next.js (Không gọi Network giúp triệt tiêu độ trễ)
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "fb47864df279b940de51df6714ab6b586e902e48227bdeea3e7eef7842e6f21a"
      );
      
      const { payload } = await jwtVerify(accessToken, secret);

      if (payload && payload.role === "admin") {
        // Thỏa mãn điều kiện: Đã xác thực + Có vai trò admin -> Cho phép truy cập định tuyến admin
        return NextResponse.next();
      }
    } catch (err) {
      // Token hết hạn, chữ ký giả mạo hoặc giải mã lỗi -> log warning và chặn
      console.warn("Next.js Server-side Edge Middleware offline verification failed:", err);
    }

    // 3. Từ chối quyền và redirect về trang chủ nếu không phải Admin
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Chỉ so khớp chạy middleware trên các trang quản trị admin
export const config = {
  matcher: ["/admin/:path*"],
};
