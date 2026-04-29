import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = ({ className = "", ...props }) => {
  return (
    <input
      className={`w-full px-5 py-3 rounded-2xl border border-purple-100 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-50 text-slate-600 bg-white placeholder-purple-200 transition-all ${className}`}
      {...props}
    />
  );
};
