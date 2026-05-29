"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => Promise<void> | void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const handleConfirm = async () => {
    if (!options) return;
    setLoading(true);
    try {
      await options.onConfirm();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1C1816] rounded-2xl shadow-2xl border border-white/[0.1] w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  options.variant === 'danger' ? 'bg-rose-500/10 text-rose-500' : 
                  options.variant === 'info' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-yellow-500/10 text-yellow-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-serif font-bold text-white">{options.title}</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {options.message}
              </p>
            </div>
            <div className="p-4 bg-black/20 border-t border-white/[0.06] flex gap-3 justify-end">
              <button 
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl transition-all disabled:opacity-50"
              >
                {options.cancelText || "Hủy"}
              </button>
              <button 
                onClick={handleConfirm}
                disabled={loading}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:grayscale ${
                  options.variant === 'danger' ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50' : 
                  options.variant === 'info' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50' :
                  'bg-gradient-to-r from-[#c9a15c] to-[#e8d8c3] hover:brightness-110 text-[#14110F] shadow-[#c9a15c]/20'
                }`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {options.confirmText || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
