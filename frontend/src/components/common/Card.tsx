import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-3xl p-6 shadow-lg shadow-purple-100/50 border border-purple-50 ${className}`}
    >
      {children}
    </div>
  );
};
