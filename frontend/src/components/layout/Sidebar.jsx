import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LINKS_BY_ROLE = {
  head_admin: [
    { to: "/dashboard", label: "Overview" },
    { to: "/dashboard/courses", label: "Courses" },
    { to: "/dashboard/users", label: "Users & Moderators" },
    { to: "/dashboard/donations", label: "Donations" },
  ],
  moderator: [
    { to: "/dashboard", label: "Overview" },
    { to: "/dashboard/courses", label: "Courses" },
    { to: "/dashboard/donations", label: "Donations" },
  ],
  instructor: [
    { to: "/dashboard", label: "Overview" },
    { to: "/dashboard/courses", label: "My Courses" },
  ],
  student: [
    { to: "/dashboard", label: "Overview" },
    { to: "/dashboard/courses", label: "Browse Courses" },
    { to: "/dashboard/my-courses", label: "My Enrollments" },
    { to: "/dashboard/my-certificates", label: "My Certificates" },
  ],
  donor: [
    { to: "/dashboard", label: "Overview" },
    { to: "/dashboard/courses", label: "Courses" },
    { to: "/dashboard/donations", label: "Donations" },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const links = LINKS_BY_ROLE[user?.role] ?? [];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-brand-dark px-4 py-6 text-white transition-transform duration-300 lg:static lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-8 px-2 text-lg font-bold">
          NGO <span className="text-brand">LMS</span>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/dashboard"}
              onClick={onClose}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-brand text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
