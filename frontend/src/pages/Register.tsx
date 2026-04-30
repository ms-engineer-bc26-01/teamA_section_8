import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card } from "../components/common/Card";
import { Toast } from "../components/common/Toast";
import { useAuthStore } from "../store/authStore";

const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(1, "お名前を入力してください")
      .max(100, "100文字以内で入力してください"),
    email: z
      .string()
      .min(1, "メールアドレスを入力してください")
      .pipe(z.email("正しい形式で入力してください")),
    password: z.string().min(8, "パスワードは8文字以上で入力してください"),
    confirmPassword: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type RegisterFormInputs = z.infer<typeof registerSchema>;

type AuthApiResponse = {
  user?: {
    id: string;
    displayName: string;
    email: string;
  };
  error?: {
    message?: string;
  };
};

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setErrorMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          displayName: data.displayName,
        }),
      });

      const result = (await response.json()) as AuthApiResponse;

      if (!response.ok || !result.user) {
        setErrorMessage(result.error?.message ?? "登録に失敗しました。");
        return;
      }

      login(result.user);
      navigate("/home");
    } catch {
      setErrorMessage(
        "通信エラーが発生しました。時間を置いて再度お試しください。",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
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
              パスワード (8文字以上)
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
            {isSubmitting ? "処理中..." : "はじめる"}
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
