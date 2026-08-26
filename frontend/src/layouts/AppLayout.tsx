import { NavLink, Outlet, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/ui";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊", end: true },
  { to: "/appointments", label: "Appointments", icon: "🗓️" },
  { to: "/patients", label: "Patients", icon: "🧑‍🤝‍🧑" },
  { to: "/doctors", label: "Doctors", icon: "🩺" },
  { to: "/billing", label: "Billing", icon: "💳" },
  { to: "/staff", label: "Staff", icon: "🛡️", adminOnly: true },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <span className="text-xl">🏥</span>
          <span className="text-sm font-semibold text-slate-800">Clinic Manager</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === "ADMIN")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
              <Badge label={user?.role ?? ""} />
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 shrink-0 text-xs font-medium text-slate-500 hover:text-red-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
