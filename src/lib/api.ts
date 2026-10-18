import axios from "axios";
import type { ApiEnvelope } from "../types";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("oj_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("oj_token");
      localStorage.removeItem("oj_user");
      if (!window.location.pathname.startsWith("/login"))
        window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
export async function request<T>(
  promise: Promise<{ data: ApiEnvelope<T> }>,
): Promise<T> {
  const response = await promise;
  if (!response.data?.success)
    throw new Error(
      response.data?.error?.details ||
        response.data?.message ||
        "Request gagal.",
    );
  return response.data.data;
}
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error))
    return (
      error.response?.data?.error?.details ||
      error.response?.data?.message ||
      error.message ||
      "Terjadi kesalahan jaringan."
    );
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan yang tidak diketahui.";
}
