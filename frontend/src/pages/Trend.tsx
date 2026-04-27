export const Trend = () => {
  return (
    <div className="min-h-[100dvh] bg-purple-50 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <h1 className="text-2xl font-black text-purple-600 mb-6">
        感情のトレンド 📈
      </h1>

      {/* スマホ(sm: 640px未満)を基準とした1カラム構成 */}
      <div className="grid gap-6 sm:max-w-md sm:mx-auto">
        <div className="bg-white p-6 rounded-3xl shadow-sm border-4 border-white">
          <h2 className="font-black text-gray-600 mb-4">今週の感情バランス</h2>
          <div className="h-48 bg-purple-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-purple-300">
            <span className="text-purple-500 font-bold text-sm">
              [ ここに Recharts のグラフ ]
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-yellow-100 p-5 rounded-3xl text-center shadow-sm">
            <span className="block text-4xl mb-2">😊</span>
            <span className="text-sm font-black text-yellow-600 block">
              Joy (喜び)
            </span>
            <span className="text-2xl font-black text-yellow-700">65%</span>
          </div>
          <div className="bg-blue-100 p-5 rounded-3xl text-center shadow-sm">
            <span className="block text-4xl mb-2">😌</span>
            <span className="text-sm font-black text-blue-600 block">
              Neutral (穏やか)
            </span>
            <span className="text-2xl font-black text-blue-700">20%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border-4 border-white">
          <h2 className="font-black text-gray-600 mb-3">AI サマリー 💡</h2>
          <p className="text-gray-600 font-bold text-sm leading-relaxed">
            今週はポジティブな感情が多く見られますが、水曜日に少し「疲れ（Sadness）」のスコアが上がっていました。週末はゆっくり休める場所にお出かけするのがおすすめです！
          </p>
        </div>
      </div>
    </div>
  );
};
