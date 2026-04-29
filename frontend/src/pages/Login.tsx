import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card } from "../components/common/Card";
import { useAuthStore } from "../store/authStore";
import apiClient from "../api/apiClient"; // ✨ 1. apiClient をインポート

// 1. Zodで入力ルールの定義（スキーマ）
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("正しいメールアドレスの形式で入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  // 2. React Hook Form の準備
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  // 3. 送信時の処理
  const onSubmit = async (data: LoginFormInputs) => {
    try {
      // ✨ 2. fetch の代わりに apiClient を使う
      const response = await apiClient.post("/auth/login", data);

      // ✨ 3. バックエンドからのデータを受け取る
      // （仕様書によると、トークンはCookieで自動保存されるため、ここではユーザー情報だけ受け取ります）
      const user = response.data.user;

      // ストアにユーザー情報を保存して画面遷移
      // ※もし useAuthStore が login(token, user) の形を必須としている場合は、
      // 一旦ダミー文字を入れて login("cookie-auth", user) としてください。
      login(response.data.token, user);

      navigate("/home");
    } catch (error) {
      console.error("Login failed:", error);
      alert(
        "ログインに失敗しました。メールアドレスかパスワードを確認してください。",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-purple-700 mb-2">
            おかえりなさい🌙
          </h1>
          <p className="text-slate-500 text-sm">今日も一日お疲れさまでした</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* メールアドレス入力 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1 ml-1">
              メールアドレス
            </label>
            <Input
              type="email"
              placeholder="hello@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-rose-500 text-xs mt-1 ml-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* パスワード入力 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1 ml-1">
              パスワード
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-rose-500 text-xs mt-1 ml-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isSubmitting}
          >
            ログインする
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          アカウントをお持ちでない方は{" "}
          <Link
            to="/register"
            className="text-purple-600 font-semibold hover:underline"
          >
            新規登録
          </Link>
        </div>
      </Card>
    </div>
  );
};
