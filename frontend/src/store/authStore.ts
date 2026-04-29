import { create } from "zustand";
import { persist } from "zustand/middleware";

// ユーザー情報の型定義
type User = {
  id: string;
  displayName: string;
  email: string;
};

// ストアが持つ状態と更新関数の型定義
type AuthState = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;

  // 状態を更新するアクション
  login: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // --- 初期状態 ---
      token: null,
      user: null,
      isAuthenticated: false,

      // --- アクション ---
      login: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      // persistの設定
      name: "auth-storage", // localStorage に保存されるキー名
      // tokenとuser情報だけを保存したい場合などは partialize を使いますが、
      // 今回は全て保存で問題ありません。
    },
  ),
);
