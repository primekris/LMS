import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <span className="font-semibold text-brand-dark">
          NGO <span className="text-brand">LMS</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-600 sm:inline">{user?.full_name}</span>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 capitalize">
          {user?.role?.replace("_", " ")}
        </span>
        <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-brand">
          Logout
        </button>
      </div>
    </header>
  );
}
