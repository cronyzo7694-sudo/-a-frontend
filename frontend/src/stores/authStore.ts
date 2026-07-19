import { create } from "zustand";
import { authApi, clearTokens, setTokens, type User } from "@/lib/api";

type AuthState = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (full_name: string, email: string, password: string) => Promise<void>;
  continueAsGuest: (displayName?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<{ dev_otp?: string; message: string }>;
  verifyPhoneOtp: (phone: string, otp: string, fullName?: string) => Promise<void>;
  logout: () => void;
  bootstrap: () => Promise<void>;
  setUser: (user: User | null) => void;
  isGuest: () => boolean;
};

function applySession(res: {
  user: User;
  access_token: string;
  refresh_token: string;
  is_guest?: boolean;
}) {
  setTokens(res.access_token, res.refresh_token);
  return {
    ...res.user,
    is_guest: Boolean(res.is_guest ?? res.user.is_guest ?? res.user.role === "guest"),
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user }),

  isGuest: () => {
    const u = get().user;
    return Boolean(u?.is_guest || u?.role === "guest");
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await authApi.login(email, password);
      set({ user: applySession(res), loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  register: async (full_name, email, password) => {
    set({ loading: true });
    try {
      const res = await authApi.register({ full_name, email, password });
      set({ user: applySession(res), loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  continueAsGuest: async (displayName) => {
    set({ loading: true });
    try {
      const res = await authApi.guest(displayName);
      set({ user: applySession(res), loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ loading: true });
    try {
      const res = await authApi.google(idToken);
      set({ user: applySession(res), loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  sendPhoneOtp: async (phone) => {
    const res = await authApi.phoneSendOtp(phone);
    return { dev_otp: res.dev_otp, message: res.message };
  },

  verifyPhoneOtp: async (phone, otp, fullName) => {
    set({ loading: true });
    try {
      const res = await authApi.phoneVerifyOtp(phone, otp, fullName);
      set({ user: applySession(res), loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  logout: () => {
    clearTokens();
    set({ user: null });
  },

  bootstrap: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ user: null, initialized: true });
      return;
    }
    try {
      const res = await authApi.me();
      set({ user: res.user, initialized: true });
    } catch {
      clearTokens();
      set({ user: null, initialized: true });
    }
  },
}));
