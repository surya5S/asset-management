import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { logoutApi } from "../../api/auth";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Landmark,
  BarChart3,
  LogOut,
  User,
} from "lucide-react";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/cards", label: "Cards", icon: CreditCard },
  { to: "/loans", label: "Loans", icon: Landmark },
  { to: "/assets", label: "Assets", icon: BarChart3 },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (_) {}
    queryClient.clear();
    logout();
    navigate("/login");
    toast.success("Logged out.");
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 border-b border-surface-border
                    bg-surface-card/80 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg bg-primary-600 flex items-center
                          justify-center text-white font-bold text-sm"
          >
            AM
          </div>
          <span className="text-slate-100 font-semibold text-base hidden sm:block">
            AssetManager
          </span>
        </Link>

        {/* Nav Links — only when logged in */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                           text-slate-400 hover:text-slate-100 hover:bg-surface
                           transition-colors duration-200"
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5
                              bg-surface rounded-lg border border-surface-border"
              >
                <div
                  className="w-6 h-6 rounded-full bg-primary-600 flex items-center
                                justify-center text-white text-xs font-bold"
                >
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <span className="text-slate-300 text-sm">{user?.fullName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost flex items-center gap-1.5 text-sm text-red-400
                           hover:text-red-300"
              >
                <LogOut size={15} />
                <span className="hidden sm:block">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary text-sm px-4 py-2">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Fixed Navbar                 - `fixed top-0 left-0 right-0` pins the navbar to the
                                    top of the viewport regardless of scroll position.
                                    z-40 keeps it above page content but below modals (z-50).
  2. backdrop-blur-md             - Frosted glass effect. The navbar background is semi-
                                    transparent (bg-surface-card/80) + blurred. Content
                                    scrolling underneath shows through blurred.
  3. NAV_LINKS array              - Config-driven navigation. Add a new page by adding one
                                    object to the array — no JSX changes needed.
  4. icon: Icon pattern           - Destructuring `icon: Icon` renames the property to
                                    a capitalized variable so React treats it as a component.
                                    Lowercase `icon` would render as an HTML tag, not a component.
  5. Conditional nav rendering    - Nav links only render when `isAuthenticated`. Public
                                    visitors see only the logo and auth buttons.
  6. Avatar initials              - `user?.fullName?.charAt(0).toUpperCase()` extracts the
                                    first letter as an uppercase avatar. Optional chaining
                                    prevents crashes if fullName is undefined.
  7. Graceful logout              - The API call is wrapped in try/catch with empty catch.
                                    If the server is down, logout still clears local state.
                                    User experience > perfect server sync.
  8. Responsive visibility        - `hidden md:flex` shows nav links only on medium screens+.
                                    `hidden sm:block` hides text labels on mobile, keeps icons.
                                    Mobile gets a clean minimal navbar.
*/
