import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginApi } from "../../api/auth";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("pin");
  const [form, setForm] = useState({ email: "", password: "", pin: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload =
        mode === "password"
          ? { email: form.email, password: form.password }
          : { email: form.email, pin: form.pin };

      const res = await loginApi(payload);
      login(res.data.user, res.data.accessToken);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h1>
        <p className="text-surface-muted text-sm mb-8">
          Sign in to your account
        </p>

        <div className="flex bg-surface rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`flex-1 py-2 text-sm rounded-md transition-colors duration-200 ${
              mode === "password"
                ? "bg-surface-card text-slate-100"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode("pin")}
            className={`flex-1 py-2 text-sm rounded-md transition-colors duration-200 ${
              mode === "pin"
                ? "bg-surface-card text-slate-100"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            PIN
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          {mode === "password" ? (
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          ) : (
            <div>
              <label className="text-sm text-slate-400 block mb-1">PIN</label>
              <input
                name="pin"
                type="password"
                inputMode="numeric"
                placeholder="••••••"
                maxLength={6}
                value={form.pin}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          No account?{" "}
          <Link
            to="/register"
            className="text-primary-400 hover:text-primary-300"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. UI Mode Toggle               - `mode` state switches between 'password' and 'pin' login.
                                    One form, two states. Conditional rendering shows the
                                    right input based on mode.
  2. Conditional Rendering        - `{mode === 'password' ? <PasswordInput /> : <PinInput />}`
                                    React unmounts and remounts the input when mode switches.
                                    The `required` attribute resets too — no stale validation.
  3. Dynamic className            - Ternary inside className string applies active/inactive
                                    styles to the toggle buttons. This pattern replaces
                                    the need for a separate CSS class per state.
  4. Payload Construction         - Building the payload object based on mode before sending.
                                    Never send empty password or pin fields — only send what's
                                    relevant to the chosen login method.
  5. type="button" on toggles     - Without this, buttons inside a form default to
                                    type="submit". Clicking the mode toggle would submit
                                    the form. Explicit `type="button"` prevents that.
  6. Segment Control UI Pattern   - The password/PIN toggle is a "segmented control" — a
                                    common mobile UI pattern for switching between modes.
                                    Built here with plain divs and conditional classes.
*/
