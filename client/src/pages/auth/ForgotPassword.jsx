import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../../api/auth";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPasswordApi({ email });
      setSent(true);
    } catch {
      // Always show success — same message regardless of whether email exists
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center justify-center px-4 py-12">
        <div className="card w-full max-w-md text-center">
          <div
            className="w-12 h-12 rounded-full bg-primary-600/20 flex items-center
                       justify-center mx-auto mb-4"
          >
            <Mail size={22} className="text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Check your email</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            If <span className="text-slate-200">{email}</span> is registered, we've sent a
            password reset link. The link expires in 15 minutes.
          </p>
          <p className="text-xs text-slate-500">
            Didn't receive it? Check your spam folder, or{" "}
            <button
              onClick={() => setSent(false)}
              className="text-primary-400 hover:text-primary-300 underline"
            >
              try again
            </button>
            .
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400
                       hover:text-slate-200 mt-8 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400
                     hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>

        <h1 className="text-2xl font-bold text-slate-100 mb-1">Forgot password?</h1>
        <p className="text-surface-muted text-sm mb-8">
          Enter your email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
