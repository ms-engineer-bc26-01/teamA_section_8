import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card } from "../components/common/Card";
import { useAuthStore } from "../store/authStore";
// 1. apiClient をインポート
import apiClient from "../api/apiClient";

// Zodで入力ルールの定義
const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(1, "お名前を入力してください")
      .max(50, "50文字以内で入力してください"),
    email: z
      .string()
      .min(1, "メールアドレスを入力してください")
      .email("正しい形式で入力してください"),
    password: z.string().min(8, "パスワードは8文字以上で入力してください"),
    confirmPassword: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type RegisterFormInputs = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  // 2. 送信処理（apiClient を使用）
  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      // fetch ではなく apiClient.post を使用
      // baseURL が http://localhost:8000/api なので、パスは "/auth/register" でOK
      const response = await apiClient.post("/auth/register", {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });

      // Axios の場合、JSONの解析は不要で response.data に中身が入っています
      const result = response.data;

      // 認証情報をストアに保存して遷移
      login(result.token, result.user);
      navigate("/home");
    } catch (error) {
      console.error("Registration failed:", error);
      // エラーメッセージの出し方は後で調整できますが、まずはアラートで確認
      alert(
        "登録に失敗しました。メールアドレスが既に使われている可能性があります。",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-purple-700 mb-2">
            はじめまして🌿
          </h1>
          <p className="text-slate-500 text-sm">
            あなたのための場所を作りましょう
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1 ml-1">
              お名前
            </label>
            <Input
              type="text"
              placeholder="ニックネーム"
              {...register("displayName")}
            />
            {errors.displayName && (
              <p className="text-rose-500 text-xs mt-1 ml-1">
                {errors.displayName.message}
              </p>
            )}
          </div>

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
              パスワード (8字以上)
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

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1 ml-1">
              パスワード (確認用)
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-rose-500 text-xs mt-1 ml-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            disabled={isSubmitting}
          >
            はじめる
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          すでにアカウントをお持ちの方は{" "}
          <Link
            to="/login"
            className="text-purple-600 font-semibold hover:underline"
          >
            ログイン
          </Link>
        </div>
      </Card>
    </div>
  );
};
