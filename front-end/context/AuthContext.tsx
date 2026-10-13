"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { User } from "@/types/listing";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<User | null>;
  logout: (redirectTo?: string) => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => null,
  logout: async () => {},
  setUser: () => {},
});

export function isProtectedPath(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname === "/listings/new") return true;
  if (pathname.startsWith("/profile")) return true;
  if (/^\/listings\/[^/]+\/edit\/?$/.test(pathname)) return true;
  if (/^\/listings\/[^/]+\/?$/.test(pathname)) return true;
  return false;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const res = await api.auth.getCurrentUser();
      if (res.authenticated && res.user) {
        setUser(res.user);
        return res.user;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (redirectTo: string = "/signin") => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error("Logout API failed:", err);
    }
    setUser(null);

    // Notify other tabs via BroadcastChannel
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: "AUTH_LOGOUT" });
      } catch {}
    }

    // Replace current history entry so the protected page cannot be navigated back to
    window.location.replace(redirectTo);
  }, []);

  // Set up BroadcastChannel and window lifecycle events (bfcache, visibility change)
  useEffect(() => {
    // 1. Initial user check
    refreshUser();

    // 2. Cross-tab synchronization via BroadcastChannel
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("roomforu_auth_channel");
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === "AUTH_LOGOUT") {
          setUser(null);
          if (isProtectedPath(window.location.pathname)) {
            window.location.replace(
              `/signin?returnTo=${encodeURIComponent(window.location.pathname)}`
            );
          } else {
            router.refresh();
          }
        } else if (event.data?.type === "AUTH_LOGIN") {
          refreshUser().then(() => router.refresh());
        }
      };
    }

    // 3. Handle browser Back-Forward Cache (bfcache) restoration
    const handlePageShow = (event: PageTransitionEvent) => {
      // If page is restored from bfcache or shown after navigation
      refreshUser().then((currentUser) => {
        if (!currentUser && isProtectedPath(window.location.pathname)) {
          window.location.replace(
            `/signin?returnTo=${encodeURIComponent(window.location.pathname)}`
          );
        } else if (event.persisted) {
          router.refresh();
        }
      });
    };

    // 4. Handle visibility change (e.g. user returning to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshUser().then((currentUser) => {
          if (!currentUser && isProtectedPath(window.location.pathname)) {
            window.location.replace(
              `/signin?returnTo=${encodeURIComponent(window.location.pathname)}`
            );
          }
        });
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [refreshUser, router]);

  // Route transition guard: check protection whenever pathname changes
  useEffect(() => {
    if (!loading && !user && isProtectedPath(pathname)) {
      // Re-verify with backend to avoid false positives during initial hydration
      refreshUser().then((verifiedUser) => {
        if (!verifiedUser && isProtectedPath(pathname)) {
          window.location.replace(
            `/signin?returnTo=${encodeURIComponent(pathname)}`
          );
        }
      });
    }
  }, [pathname, user, loading, refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Helper to broadcast login to all open tabs */
export function broadcastAuthLogin() {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    try {
      const channel = new BroadcastChannel("roomforu_auth_channel");
      channel.postMessage({ type: "AUTH_LOGIN" });
      channel.close();
    } catch {}
  }
}
