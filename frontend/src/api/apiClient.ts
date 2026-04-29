import axios from "axios";
// Zustandのstoreをインポート（パスはプロジェクトの構成に合わせて調整してください）
import { useAuthStore } from "../store/authStore";

const apiClient = axios.create({
  // Aさんの app.ts と openapi.yaml の設計（localhost:3000/api）に合わせます
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// 送信前のインターセプター：すべてのリクエストに認証トークンを付与する
apiClient.interceptors.request.use(
  (config) => {
    // authStoreから現在のトークンを取得
    const token = useAuthStore.getState().token;

    // openapi.yaml の securitySchemes (bearerAuth) に基づき、Bearer形式でヘッダーにセット
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

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
