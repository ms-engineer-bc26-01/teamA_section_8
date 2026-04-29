import React from "react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Card } from "../components/common/Card";
import { Toast } from "../components/common/Toast";
import { useAuthStore } from "../store/authStore";

const UiPreview: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const handleTestLogin = () => {
    login({
      id: "1",
      displayName: "テストユーザー",
      email: "test@example.com",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-10 font-sans text-slate-700">
      {/* --- テスト用のUIを一番上に追加 --- */}
      <section className="mb-12 p-6 bg-white rounded-3xl shadow-sm border border-purple-100">
        <h2 className="text-xl font-semibold mb-4 text-slate-600">
          Zustand Persist Test
        </h2>
        <div className="mb-4">
          <p>
            ログイン状態: {isAuthenticated ? "✅ ログイン中" : "❌ 未ログイン"}
          </p>
          <p>ユーザー名: {user?.displayName || "なし"}</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={handleTestLogin} variant="primary">
            ログインする
          </Button>
          <Button onClick={logout} variant="outline">
            ログアウトする
          </Button>
        </div>
      </section>
      <h1 className="text-3xl font-bold text-purple-800/80 mb-10 border-b-2 border-purple-100 pb-2 inline-block">
        UI Components Preview
      </h1>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-slate-600">
          1. Buttons
        </h2>
        <div className="flex gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-slate-600">2. Inputs</h2>
        <div className="max-w-md">
          <Input placeholder="いまの気持ちを教えてね..." />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-slate-600">3. Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold mb-2 text-purple-700">
              優しい雰囲気のカード
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              ふんわりとした影と丸みを持たせることで、画面全体が落ち着いた印象になります。余白を広めに取るのもポイントです。
            </p>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-white">
            <h3 className="text-lg font-semibold mb-2 text-purple-700">
              ほんのり色付き
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              背景にうすいグラデーションを敷くことで、単調にならず上品な仕上がりになります。
            </p>
          </Card>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-slate-600">
          4. Toasts (Static)
        </h2>
        <div className="flex flex-col gap-4 items-start">
          <Toast message="保存に成功しました" type="success" />
          <Toast message="エラーが発生しました" type="error" />
          <Toast message="新しい通知があります" type="info" />
        </div>
      </section>
    </div>
  );
};

export default UiPreview;
