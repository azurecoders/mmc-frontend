"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, RoleCode } from "@/types";
import { apiFetch } from "@/lib/api";
import { reconnectSocketWithToken } from "@/lib/socket";

interface AuthContextType {
  user: User | null;
  /** True only while the stored session is being restored on first load. */
  loading: boolean;
  activeRole: RoleCode | null;
  login: (email: string, pass: string) => Promise<User>;
  register: (email: string, phone: string, full_name: string, pass: string) => Promise<User>;
  logout: () => void;
  hasPermission: (permCode: string) => boolean;
  hasRole: (role: RoleCode) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function primaryRole(u: User | null): RoleCode | null {
  return (u?.roles?.[0]?.code as RoleCode) || (u ? "PATIENT" : null);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<RoleCode | null>(null);

  useEffect(() => {
    // Restore an existing session
    const storedUser = localStorage.getItem("hms_user");
    const storedToken = localStorage.getItem("hms_access_token");
    if (storedUser && storedToken) {
      try {
        const u = JSON.parse(storedUser) as User;
        setUser(u);
        setActiveRole(primaryRole(u));
      } catch {
        localStorage.removeItem("hms_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username_or_email: email, password: pass }),
    });

    localStorage.setItem("hms_access_token", data.access_token);
    localStorage.setItem("hms_refresh_token", data.refresh_token);
    localStorage.setItem("hms_user", JSON.stringify(data.user));

    setUser(data.user);
    setActiveRole(primaryRole(data.user));
    reconnectSocketWithToken(data.access_token);
    return data.user as User;
  };

  const register = async (email: string, phone: string, full_name: string, pass: string): Promise<User> => {
    await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, phone, full_name, password: pass }),
    });
    // Sign in straight after registration
    return login(email, pass);
  };

  const logout = () => {
    apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("hms_access_token");
    localStorage.removeItem("hms_refresh_token");
    localStorage.removeItem("hms_user");
    setUser(null);
    setActiveRole(null);
  };

  const hasRole = (role: RoleCode) => !!user?.roles?.some((r) => r.code === role);

  const hasPermission = (permCode: string): boolean => {
    if (!user) return false;
    for (const r of user.roles || []) {
      if (r.code === "SUPER_ADMIN") return true;
      for (const p of r.permissions || []) {
        if (p.code === "*" || p.code === permCode) return true;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, activeRole, login, register, logout, hasPermission, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
