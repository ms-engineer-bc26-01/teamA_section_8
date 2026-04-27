import { Link } from "react-router-dom";

export const Login = () => {
  return (
    // iOSでの表示崩れを防ぐ 100dvh と、下部のホームバーを考慮したセーフエリア設定
    <div className="min-h-[100dvh] bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center items-center p-6 pb-[env(safe-area-inset-bottom)]">
      {/* PC表示でも間延びしないよう最大幅を 375px に制限しつつ、ポップなカードデザインを維持 */}
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border-4 border-white sm:max-w-[375px]">
        <h1 className="text-3xl font-black text-center text-blue-500 mb-2">
          おかえりなさい ✨
        </h1>
        <p className="text-center text-gray-500 mb-8 text-sm font-bold">
          今日もセルフケアを始めましょう
        </p>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="メールアドレス"
            // text-base: iOSの自動ズーム防止(16px以上)
            // min-h-[44px]: タップ領域の確保
            className="w-full p-4 min-h-[44px] text-base rounded-2xl bg-gray-100 border-2 border-transparent focus:border-blue-300 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-400"
          />
          <input
            type="password"
            placeholder="パスワード"
            className="w-full p-4 min-h-[44px] text-base rounded-2xl bg-gray-100 border-2 border-transparent focus:border-blue-300 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-400"
          />
          <button className="w-full min-h-[44px] bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95">
            ログイン
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm font-bold">
          はじめての方は
          {/* Linkコンポーネントで Register.tsx への遷移を繋ぎ込み */}
          <Link
            to="/register"
            className="text-blue-500 ml-1 cursor-pointer hover:underline p-2"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
};
