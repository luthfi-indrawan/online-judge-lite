import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  Code2,
  LayoutDashboard,
  LogOut,
  Medal,
  Settings2,
  ShieldCheck,
  Users,
  Menu,
  X,
  Layers3,
  TerminalSquare,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { initials } from "../lib/utils";
const studentLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/groups", label: "Problem groups", icon: Layers3 },
  { to: "/scoreboards", label: "Scoreboard", icon: Medal },
];
const adminLinks = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Manajemen user", icon: Users },
  { to: "/admin/groups", label: "Problem groups", icon: Layers3 },
  { to: "/admin/problems", label: "Manajemen soal", icon: BookOpen },
  { to: "/scoreboards", label: "Scoreboard", icon: Medal },
];
export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = user?.role === "ADMIN" ? adminLinks : studentLinks;
  const title =
    location.pathname === "/"
      ? "Dashboard"
      : location.pathname.startsWith("/admin/users")
        ? "Manajemen user"
        : location.pathname.startsWith("/admin/groups")
          ? "Problem groups"
          : location.pathname.startsWith("/admin/problems")
            ? "Manajemen soal"
            : location.pathname.startsWith("/scoreboards")
              ? "Scoreboard"
              : location.pathname.startsWith("/groups")
                ? "Problem groups"
                : location.pathname.startsWith("/problems")
                  ? "Problem workspace"
                  : "Online Judge";
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Code2 size={23} />
          </div>
          <div>
            <strong>
              OJ<span>Lite</span>
            </strong>
            <small>ONLINE JUDGE PLATFORM</small>
          </div>
          <button
            className="mobile-close icon-btn"
            onClick={() => setMobileOpen(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Manajemen user" && <span className="nav-admin-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sandbox-card">
            <div className="sandbox-icon">
              <TerminalSquare size={18} />
            </div>
            <div>
              <strong>Code sandbox</strong>
              <p>C & C++ execution</p>
            </div>
            <span className="status-dot" />
          </div>
          <button className="nav-link logout-link" onClick={logout}>
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
          <div className="sidebar-foot">
            OJ Lite <span>•</span> v1.0.0
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Tutup menu"
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumbs">
              <span>Workspace</span>
              <span className="crumb-slash">/</span>
              <strong>{title}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <div className="system-status">
              <span className="status-dot" /> System operational
            </div>
            <div className="topbar-divider" />
            <div className="profile-chip">
              <div className="avatar">{initials(user?.name)}</div>
              <div className="profile-info">
                <strong>{user?.name || "User"}</strong>
                <span>
                  {user?.role === "ADMIN" ? "Administrator" : "Student"}
                </span>
              </div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} OJ Lite</span>
          <span>Built for focused problem solving</span>
        </footer>
      </main>
    </div>
  );
}
