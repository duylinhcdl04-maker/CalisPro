import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  timeout: 15000,
});

/** Phát ra khi phiên đăng nhập hết hạn / token không còn hợp lệ (AuthProvider lắng nghe để đăng xuất). */
export const SESSION_EXPIRED_EVENT = "calis:session-expired";

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("calis_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = Boolean(error.config?.headers?.Authorization);
    const isAuthEndpoint = String(error.config?.url ?? "").startsWith("/auth/");
    // Request có gửi token mà bị 401 -> token hết hạn/không hợp lệ: đăng xuất thay vì để giao diện
    // tiếp tục như đang đăng nhập (mọi thao tác sau đó đều lỗi khó hiểu, vd. "Network Error" khi upload).
    if (error.response?.status === 401 && sentToken && !isAuthEndpoint) {
      localStorage.removeItem("calis_token");
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);
