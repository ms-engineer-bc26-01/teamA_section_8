import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card } from "../components/common/Card";
import { useAuthStore } from "../store/authStore";

// 1. Zodで入力ルールの定義（スキーマ）
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("正しいメールアドレスの形式で入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

// スキーマからTypeScriptの型を自動生成
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
  const onSubmit = (data: LoginFormInputs) => {
    // ※本来はここでAPIを叩きますが、今はダミーでログインを成功させます
    console.log("送信データ:", data);

    // ストアにログイン状態をセットしてホームへ遷移
    login("dummy-jwt-token", {
      id: "1",
      displayName: "ゲスト",
      email: data.email,
    });
    navigate("/home");
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
            {/* エラー表示（DoD要件） */}
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
            {/* エラー表示（DoD要件） */}
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
