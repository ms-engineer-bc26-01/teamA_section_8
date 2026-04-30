import React from "react";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { useAuthStore } from "../store/authStore";

export const Home: React.FC = () => {
  const { user } = useAuthStore();

  const mockDiaries = [
    {
      id: "1",
      date: "2026.04.26",
      title: "穏やかな日曜日",
      score: 85,
      mood: "🌿",
    },
    {
      id: "2",
      date: "2026.04.25",
      title: "少し疲れたけれど",
      score: 45,
      mood: "☁️",
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-full overflow-x-hidden">
      <header className="mb-8 mt-4 md:mt-0">
        <div className="flex items-center gap-2 mb-1">
          <span aria-hidden>✨</span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">
            こんにちは、{user?.displayName || "ゲスト"}さん
          </h2>
        </div>
        <p className="text-sm md:text-base text-slate-500 ml-7">
          今日はどんな一日になりそうですか？
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="col-span-1 lg:col-span-5 order-1">
          <Card className="border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
            <h3 className="font-semibold mb-4 text-purple-700 flex items-center gap-2">
              今のきもちをクイック入力
            </h3>
            <div className="space-y-3">
              <textarea
                className="w-full p-4 rounded-2xl border border-purple-100 focus:outline-none focus:ring-4 focus:ring-purple-50 text-slate-600 bg-white placeholder-purple-200 transition-all resize-none h-24 text-sm"
                placeholder="今、どんな気分？（短くてもOK）"
              />
              <Button className="w-full flex items-center justify-center gap-2 py-2">
                <span aria-hidden>📤</span>
                <span>きろくする</span>
              </Button>
            </div>
          </Card>
        </section>

        <section className="col-span-1 lg:col-span-7 order-2">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-semibold text-slate-700">最近のきろく</h3>
            <button className="text-xs md:text-sm text-purple-600 hover:underline">
              すべて見る
            </button>
          </div>

          <div className="space-y-4">
            {mockDiaries.map((diary) => (
              <Card
                key={diary.id}
                className="hover:shadow-purple-100/80 transition-shadow cursor-pointer p-4 md:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <span className="text-2xl md:text-3xl flex-shrink-0">
                      {diary.mood}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-xs text-slate-400 font-medium">
                        {diary.date}
                      </p>
                      <h4 className="font-bold text-slate-700 text-sm md:text-base truncate">
                        {diary.title}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] md:text-xs text-slate-400 mb-0.5">
                      スコア
                    </p>
                    <span className="text-base md:text-lg font-bold text-purple-500">
                      {diary.score}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
