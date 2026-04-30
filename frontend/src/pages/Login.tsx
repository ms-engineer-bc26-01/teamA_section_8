import React, { useState } from "react"; // 1. useState を追加
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card } from "../components/common/Card";
import { Toast } from "../components/common/Toast"; // 2. Toast をインポート
import { useAuthStore } from "../store/authStore";
import apiClient from "../api/apiClient"; // ✨ 1. apiClient をインポート

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email({ message: "正しいメールアドレスの形式で入力してください" }),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  // 3. エラーメッセージの状態を定義
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      // Cookie認証のため token はストア不要。user オブジェクトのみ保存
      login(response.data.user);
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
      {/* 6. エラーがある場合のみ Toast を表示 */}
      {errorMessage && (
        <Toast
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage(null)}
        />
      )}

      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-purple-700 mb-2">
            おかえりなさい🌙
          </h1>
          <p className="text-slate-500 text-sm">今日も一日お疲れさまでした</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            {isSubmitting ? "処理中..." : "ログインする"}
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
