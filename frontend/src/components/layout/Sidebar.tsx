import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { navigationItems } from "./navigationItems";

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden md:flex md:w-64 bg-white border-r border-gray-200 flex-col p-4">
      <h1 className="text-xl font-bold text-purple-700 px-2 py-4">Selfcare 🌿</h1>
      <nav className="mt-2 space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-colors ${
              isActive(item.path)
                ? "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <button
        type="button"
        className="mt-auto w-full px-3 py-2 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-colors"
        onClick={handleLogout}
      >
        ログアウト
      </button>
    </aside>
  );
};
