"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL, fetchWithAuth } from "./api";

// Cấu trúc đối tượng Người dùng (User)
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  avatar?: string;
  phone?: string;
  address?: string;
}

// Cấu trúc của AuthContext
interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; devOtpCode?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
  syncProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Hàm tự động đồng bộ/kiểm tra phiên đăng nhập qua Cookie trên mount
  const checkSession = async () => {
    try {
      // Gọi refresh token để lấy Access Token mới qua cookie nếu tồn tại
      const refreshRes = await fetch(`${API_BASE_URL}/api/users/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Cực kỳ quan trọng đối với HttpOnly Cookie
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.user) {
          // Lấy thông tin chi tiết qua /me
          const profileRes = await fetchWithAuth(`${API_BASE_URL}/api/users/me`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.success && profileData.data) {
              setUser({
                id: profileData.data._id,
                name: profileData.data.name,
                email: profileData.data.email,
                role: profileData.data.role,
                avatar: profileData.data.avatar,
                phone: profileData.data.phone,
                address: profileData.data.address,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Auth session bootstrap failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      if (typeof window !== "undefined") {
        if (!window.location.pathname.startsWith("/login")) {
          const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?redirect=${currentPath}&expired=true`;
        }
      }
    };

    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth-session-expired", handleSessionExpired);
    };
  }, []);

  // 2. Hàm đăng nhập
  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || "Đăng nhập thất bại" };
      }
    } catch (err) {
      return { success: false, message: "Kết nối máy chủ thất bại" };
    }
  };

  // 3. Hàm đăng ký tài khoản mới
  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || "Đăng ký tài khoản thất bại" };
      }
    } catch (err) {
      return { success: false, message: "Kết nối máy chủ thất bại" };
    }
  };

  // 4. Hàm đăng xuất tài khoản
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/users/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      // Luôn xóa trạng thái đăng nhập ở Client bất kể API thành công hay thất bại
      setUser(null);
    }
  };

  // 5. Hàm yêu cầu quên mật khẩu
  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/forgotpassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message,
          devOtpCode: data.devOtpCode // Trả về OTP dưới dạng Sandbox chỉ khi ở môi trường development
        };
      } else {
        return { success: false, message: data.message || "Không thể thực hiện yêu cầu quên mật khẩu" };
      }
    } catch (err) {
      return { success: false, message: "Kết nối máy chủ thất bại" };
    }
  };

  // 6. Hàm đặt lại mật khẩu mới
  const resetPassword = async (token: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/resetpassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Đặt lại mật khẩu thất bại" };
      }
    } catch (err) {
      return { success: false, message: "Kết nối máy chủ thất bại" };
    }
  };

  // 7. Đồng bộ thủ công dữ liệu tài khoản
  const syncProfile = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setUser({
            id: data.data._id,
            name: data.data.name,
            email: data.data.email,
            role: data.data.role,
            avatar: data.data.avatar,
            phone: data.data.phone,
            address: data.data.address,
          });
        }
      }
    } catch (err) {
      console.error("Sync profile error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        syncProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
