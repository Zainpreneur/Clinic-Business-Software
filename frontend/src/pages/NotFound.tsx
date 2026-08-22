import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 text-center">
      <p className="text-4xl">🔍</p>
      <h1 className="text-lg font-semibold text-slate-800">Page not found</h1>
      <Link to="/" className="text-sm text-brand-600 hover:underline">
        Back to dashboard
      </Link>
    </div>
  );
}
