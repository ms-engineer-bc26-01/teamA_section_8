import React from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  // 1. 追加：閉じるための関数を受け取る準備（? をつけて任意項目にしています）
  onClose?: () => void;
};

// 2. 追加：引数に onClose を追加
export const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  onClose,
}) => {
  const styles = {
    success: "bg-teal-50 text-teal-600 border-teal-100",
    error: "bg-rose-50 text-rose-600 border-rose-100",
    info: "bg-purple-50 text-purple-600 border-purple-100",
  };

  const icons = {
    success: "🌿",
    error: "⚠️",
    info: "✨",
  };

  return (
    <div
      className={`inline-flex items-center px-6 py-3 rounded-2xl border shadow-sm font-medium ${styles[type]}`}
    >
      <span className="mr-3 text-lg">{icons[type]}</span>

      {/* メッセージ部分（flex-grow をつけて、×ボタンを右端に押しやります） */}
      <span className="flex-grow">{message}</span>

      {/* 3. 追加：onClose が渡された時だけ、×ボタンを表示する */}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="閉じる"
        >
          ✕
        </button>
      )}
    </div>
  );
};
