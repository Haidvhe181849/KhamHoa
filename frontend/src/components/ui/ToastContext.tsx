"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string) => toast(message, "success"), [toast]);
  const error = useCallback((message: string) => toast(message, "error"), [toast]);
  const info = useCallback((message: string) => toast(message, "info"), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] border border-white/20 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 w-max max-w-sm ${
              t.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
              t.type === "error" ? "bg-rose-50 text-rose-600 border-rose-200" :
              "bg-blue-50 text-blue-600 border-blue-200"
            }`}
          >
            <div className={`p-1.5 rounded-full ${
              t.type === "success" ? "bg-emerald-100" :
              t.type === "error" ? "bg-rose-100" :
              "bg-blue-100"
            }`}>
              {t.type === "success" && <CheckCircle2 className="w-5 h-5" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5" />}
              {t.type === "info" && <Info className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold tracking-wider uppercase mb-0.5 opacity-80">
                {t.type === "success" ? "Thành công" : t.type === "error" ? "Thất bại" : "Thông báo"}
              </p>
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{t.message}</p>
            </div>
            <button 
              onClick={() => removeToast(t.id)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors ml-2"
            >
              <X className="w-4 h-4 opacity-50" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
