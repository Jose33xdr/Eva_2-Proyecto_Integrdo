import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "../lib/api";
import { hasUserPermission } from "../lib/access";
import type {
  AuthUser,
  LoginResponse,
} from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  authenticated: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);

const ACCESS_KEY = "farmacia_access_token";
const REFRESH_KEY = "farmacia_refresh_token";
const USER_KEY = "farmacia_user";

const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);

    return raw
      ? (JSON.parse(raw) as AuthUser)
      : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] =
    useState<AuthUser | null>(() =>
      localStorage.getItem(ACCESS_KEY) ? getStoredUser() : null,
    );

  const [loading, setLoading] =
    useState(() => Boolean(localStorage.getItem(ACCESS_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);

    setUser(null);
  }, []);

  const refreshProfile =
    useCallback(async () => {
      const accessToken =
        localStorage.getItem(ACCESS_KEY);

      if (!accessToken) {
        clearSession();
        setLoading(false);
        return;
      }

      try {
        const { data } =
          await api.get<{ user: AuthUser }>("/auth/me");

        const profile = data.user;

        setUser(profile);

        localStorage.setItem(
          USER_KEY,
          JSON.stringify(profile),
        );
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    }, [clearSession]);

  useEffect(() => {
    const accessToken = localStorage.getItem(ACCESS_KEY);

    if (!accessToken) {
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      return;
    }

    let active = true;

    api
      .get<{ user: AuthUser }>("/auth/me")
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      })
      .catch(() => {
        if (!active) return;
        clearSession();
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(
    async (
      username: string,
      password: string,
    ) => {
      const { data } =
        await api.post<LoginResponse>(
          "/auth/login",
          {
            username,
            password,
          },
        );

      localStorage.setItem(
        ACCESS_KEY,
        data.accessToken,
      );

      localStorage.setItem(
        REFRESH_KEY,
        data.refreshToken,
      );

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(data.user),
      );

      setUser(data.user);

      return data.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken =
      localStorage.getItem(REFRESH_KEY);

    try {
      if (refreshToken) {
        await api.post("/auth/logout", {
          refreshToken,
        });
      }
    } catch {
      // El cierre local igualmente se realiza.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const hasPermission =
    useCallback(
      (permission: string) => {
        return hasUserPermission(user, permission);
      },
      [user],
    );

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        loading,
        authenticated: Boolean(user),
        login,
        logout,
        refreshProfile,
        hasPermission,
      }),
      [
        user,
        loading,
        login,
        logout,
        refreshProfile,
        hasPermission,
      ],
    );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider",
    );
  }

  return context;
};
