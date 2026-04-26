import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  className = "",
  ...props
}) => {
  const baseStyle =
    "px-6 py-3 rounded-full font-medium transition-all duration-300 ease-out active:scale-95";

  const variants = {
    primary:
      "bg-purple-400 text-white hover:bg-purple-500 shadow-md shadow-purple-200",
    secondary:
      "bg-fuchsia-300 text-white hover:bg-fuchsia-400 shadow-md shadow-fuchsia-200",
    outline:
      "bg-white border-2 border-purple-200 text-purple-500 hover:bg-purple-50 shadow-sm",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
