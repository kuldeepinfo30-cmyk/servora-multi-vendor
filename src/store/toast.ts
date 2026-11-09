import { create } from 'zustand';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  tone?: 'success' | 'error' | 'info' | 'warning';
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, message?: string) =>
    useToast.getState().push({ title, message, tone: 'success' }),
  error: (title: string, message?: string) =>
    useToast.getState().push({ title, message, tone: 'error' }),
  info: (title: string, message?: string) =>
    useToast.getState().push({ title, message, tone: 'info' }),
  warning: (title: string, message?: string) =>
    useToast.getState().push({ title, message, tone: 'warning' }),
};
