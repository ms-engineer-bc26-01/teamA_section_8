import React from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  visible?: boolean;
  duration?: number; // ms, 0 = 手動消去
  onClose?: () => void;
};

export const Toast: React.FC<ToastProps> = ({ message, type = "success" }) => {
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
      {message}
    </div>
  );
};
