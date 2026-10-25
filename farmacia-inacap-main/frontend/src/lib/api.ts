import axios from "axios";
import { describeValidationIssues } from "./apiErrors";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL =
  configuredApiUrl ||
  (import.meta.env.PROD
    ? "http://farmagestion-backend-env-3.eba-2mi4erfp.us-east-1.elasticbeanstalk.com/api"
    : "http://localhost:3000/api");

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("farmacia_access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !String(original.url ?? "").includes("/auth/login") &&
      !String(original.url ?? "").includes("/auth/refresh")
    ) {
      const refreshToken = localStorage.getItem("farmacia_refresh_token");

      if (refreshToken) {
        original._retry = true;

        try {
          const { data } = await axios.post<{
            accessToken: string;
            refreshToken?: string;
          }>(
            `${API_URL}/auth/refresh`,
            {
              refreshToken,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
              timeout: 15000,
            },
          );

          const accessToken = data.accessToken;
          const nextRefreshToken = data.refreshToken;

          localStorage.setItem("farmacia_access_token", accessToken);
          if (nextRefreshToken) {
            localStorage.setItem("farmacia_refresh_token", nextRefreshToken);
          }

          original.headers = {
            ...(original.headers ?? {}),
            Authorization: `Bearer ${accessToken}`,
          };

          return api(original);
        } catch {
          localStorage.removeItem("farmacia_access_token");
          localStorage.removeItem("farmacia_refresh_token");
          localStorage.removeItem("farmacia_user");

          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const details = describeValidationIssues(error.response?.data?.error?.details);
    if (details) return details;

    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return "El servidor tardó demasiado en responder. Espera unos segundos e inténtalo de nuevo.";
      }
      if (error.code === "ERR_NETWORK") {
        return "No pudimos conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.";
      }
    }

    return (
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "No fue posible completar la solicitud"
    );
  }

  return error instanceof Error
    ? error.message
    : "No fue posible completar la solicitud";
};
