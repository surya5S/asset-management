import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { registerApi } from "../../api/auth";
import toast from "react-hot-toast";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    pin: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!/^\d{4,6}$/.test(form.pin)) {
      toast.error("PIN must be 4–6 digits.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerApi(form);
      login(res.data.user, res.data.accessToken);
      toast.success("Account created!");
      toast.success("Navigating to Dashboard...");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">
          Create account
        </h1>
        <p className="text-surface-muted text-sm mb-8">
          Start tracking your finances
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">
              Full name
            </label>
            <input
              name="fullName"
              type="text"
              placeholder="John Doe"
              value={form.fullName}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

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

          <div>
            <label className="text-sm text-slate-400 block mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-1">
              Confirm password
            </label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 block mb-1">
              PIN{" "}
              <span className="text-surface-muted">
                (4–6 digits, for recovery)
              </span>
            </label>
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

          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-400 hover:text-primary-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Controlled Inputs            - `value={form.fullName}` + `onChange={handleChange}` makes
                                    React the single source of truth for input values.
                                    The DOM never leads — React state always drives the UI.
  2. Single handleChange          - `[e.target.name]: e.target.value` uses computed property
                                    names. One handler for all inputs — the `name` attribute
                                    on each input maps to the matching key in state.
  3. Spread + Override Pattern    - `{ ...prev, [key]: value }` spreads all existing state
                                    then overrides just the changed field. State is immutable
                                    — never mutate directly, always return a new object.
  4. e.preventDefault()           - Stops the browser's default form submission (which would
                                    reload the page). React handles submission via JS instead.
  5. Client-side Validation       - Password match and PIN regex checked before the API call.
                                    Saves a round trip and gives instant feedback. Server
                                    still validates too — never trust only the client.
  6. Regex Test (/^\d{4,6}$/)     - `^` = start, `\d` = digit, `{4,6}` = 4 to 6 times,
                                    `$` = end. Ensures the whole string is 4–6 digits only.
  7. loading state                - Disables the button and changes its text while the API
                                    call is in flight. Prevents double-submission.
  8. try/catch/finally            - finally always runs — setLoading(false) no matter if
                                    the request succeeded or failed. Keeps UI consistent.
  9. Optional chaining on error   - `err.response?.data?.message` safely navigates the
                                    error object. Network errors have no `response` — without
                                    `?.` this would throw a second error.
  10. inputMode="numeric"         - On mobile, this shows the numeric keyboard for the PIN
                                    field without restricting input type to number.
  11. useNavigate                 - React Router's programmatic navigation hook. Redirects
                                    to dashboard after successful registration.
  12. toast notifications         - Global feedback system. Works from any component without
                                    passing callbacks. Registered in main.jsx via <Toaster>.
*/
