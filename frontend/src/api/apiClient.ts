import axios from "axios";
import { useAuthStore } from "../store/authStore";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  // HttpOnly Cookie を自動付与（Cookie認証）
  withCredentials: true,
});

// 受信後のインターセプター：認証エラーなどの共通処理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized: トークン切れや未ログインの場合
    if (error.response?.status === 401) {
      console.warn("認証が期限切れです。ログイン画面に移動します。");

      // authStoreのログアウト処理を呼び出して状態をクリア
      useAuthStore.getState().logout();

      // ログイン画面へリダイレクト（React Routerを使っている場合はここを調整）
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
