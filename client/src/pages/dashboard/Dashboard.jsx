import { useAuth } from "../../context/AuthContext";

export default function () {
  const { user, logout } = useAuth();
  return (
    <div className="text-white p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-slate-400 mt-2">Welcome, {user?.email}</p>
      <button onClick={logout} className="btn-primary mt-4">
        Logout
      </button>
    </div>
  );
}
