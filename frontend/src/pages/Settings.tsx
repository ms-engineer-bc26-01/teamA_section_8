export const Settings = () => {
  return (
    <div className="p-6 pb-10 min-h-full bg-gray-50">
      <h1 className="text-2xl font-black text-gray-700 mb-6">設定 ⚙️</h1>

      {/* スマホ(sm)サイズ以上での見栄えを整えるラッパー */}
      <div className="space-y-6 sm:max-w-md sm:mx-auto">
        {/* プロフィール設定 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
          <h2 className="font-black text-gray-500 mb-4 text-sm">
            アカウント情報
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">
                お名前 (表示名)
              </label>
              {/* ゆくゆくはDBの display_name が入ります */}
              <input
                type="text"
                defaultValue="ゲストユーザー"
                className="w-full p-3 min-h-[44px] rounded-xl bg-gray-50 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                defaultValue="demo@example.com"
                disabled
                className="w-full p-3 min-h-[44px] rounded-xl bg-gray-100 font-bold text-gray-400 outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* アプリ設定（ダミーのトグルスイッチ） */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100">
          <h2 className="font-black text-gray-500 mb-4 text-sm">アプリ設定</h2>
          <ul className="space-y-4">
            <li className="flex justify-between items-center">
              <span className="font-bold text-gray-700">通知を受け取る</span>
              <div className="w-12 h-6 bg-blue-500 rounded-full flex items-center p-1 justify-end cursor-pointer">
                <div className="bg-white w-4 h-4 rounded-full shadow-sm"></div>
              </div>
            </li>
            <li className="flex justify-between items-center">
              <span className="font-bold text-gray-700">ダークモード</span>
              <div className="w-12 h-6 bg-gray-200 rounded-full flex items-center p-1 justify-start cursor-pointer">
                <div className="bg-white w-4 h-4 rounded-full shadow-sm"></div>
              </div>
            </li>
          </ul>
        </div>

        {/* ログアウトボタン */}
        <button className="w-full min-h-[44px] bg-red-50 hover:bg-red-100 text-red-500 font-bold py-4 rounded-2xl transition-transform active:scale-95 border-2 border-transparent">
          ログアウト
        </button>
      </div>
    </div>
  );
};
