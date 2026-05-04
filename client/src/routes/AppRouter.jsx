import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import CreditCards from "../pages/cards/CreditCards";
import Loans from "../pages/loans/Loans";
import LoanDetail from "../pages/loans/LoanDetail";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import Expenses from "../pages/expenses/Expenses";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 border-primary-500 border-t-transparent
                          rounded-full animate-spin"
          />
          <p className="text-surface-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

// Sits inside the Router so it has access to useNavigate
function SessionWatcher() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    const handleForceLogout = () => {
      queryClient.clear();
      navigate("/login", { replace: true });
      toast.error("Session expired. Please sign in again.");
    };

    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, [navigate, queryClient]);

  return null;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cards"
        element={
          <ProtectedRoute>
            <CreditCards />
          </ProtectedRoute>
        }
      />

      <Route
        path="/loans"
        element={
          <ProtectedRoute>
            <Loans />
          </ProtectedRoute>
        }
      />

      <Route
        path="/loans/:id"
        element={
          <ProtectedRoute>
            <LoanDetail />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />

      {/* Invisible component — just watches for session expiry */}
      <Route path="*" element={<SessionWatcher />} />
    </Routes>
  );
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. SessionWatcher component     - A renderless component (returns null) that lives inside
                                    the Router so it has access to useNavigate. Its only
                                    job is to listen for 'auth:logout' and handle navigation.
                                    You can't call useNavigate outside a Router — this
                                    pattern gets around that cleanly.
  2. Renderless component         - A React component that returns null. No UI, just logic
                                    and side effects. Valid pattern for things like event
                                    listeners, keyboard shortcuts, analytics, timers.
  3. queryClient.clear() here too - When session expires mid-use, cache must be wiped
                                    here as well — same reason as the manual logout.
                                    Stale data from the expired session shouldn't persist.
  4. toast.error on expiry        - Tells the user exactly why they ended up on the login
                                    page. Without this, getting silently redirected to login
                                    mid-session is confusing. The message removes the confusion.
  5. navigate with replace:true   - Replaces the current history entry. The user can't
                                    press back and return to the dashboard after session expiry.
  6. Dual event listeners         - AuthContext clears state, SessionWatcher handles navigation
                                    and cache. Each listener does one job. They both fire
                                    from the same event but handle different concerns.
*/
