import React, { useState } from "react"; // 1. useState を追加
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card } from "../components/common/Card";
import { Toast } from "../components/common/Toast"; // 2. Toast をインポート
import { useAuthStore } from "../store/authStore";

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

  // 3. エラーメッセージの状態を定義
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  // 4. 送信時の処理を非同期(async)に変更
  const onSubmit = async (data: LoginFormInputs) => {
    setErrorMessage(null); // 処理開始時にエラーをリセット

    try {
      // 本来はここで API を呼び出します
      // 例: const response = await fetch('/api/auth/login', { ... });
      // if (!response.ok) throw response; // 失敗時は response を throw

      // 現状はモックログイン処理
      login("dummy-jwt-token", {
        id: "1",
        displayName: "ゲスト",
        email: data.email,
      });
      navigate("/home");
    } catch (error) {
      // 5. 指摘に基づいたエラー情報の抽出
      if (error instanceof Response) {
        const errorData = await error.json().catch(() => null);
        setErrorMessage(
          errorData?.error?.message ?? "ログインに失敗しました。",
        );
      } else {
        setErrorMessage(
          "通信エラーが発生しました。時間を置いて再度お試しください。",
        );
      }
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
